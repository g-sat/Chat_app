/* eslint-disable react-native/no-inline-styles */
import React, {useRef, useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import { messageService, ticketService, userService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../core/global';
import { setMessages, setLoading, clearMessages, addMessage } from '../core/messageSlice';
import { chatWebSocket } from '../services/websockets';
import { format, isToday } from 'date-fns';
import {isYesterday} from 'date-fns/isYesterday';
import { getUserColor } from '../common/colors';
import Icon from 'react-native-vector-icons/Entypo';

type ChatScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Chat'>;
  route: {
    params: {
      ticketId: number;
      isActive: boolean;
    };
  };
};

type UserInfo = {
  name: string;
  color: string;
};

// Helper to format date separators
const getDateLabel = (date: Date) => {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
};

// Utility to get initials from a name
function getInitials(name: string) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const ChatScreen: React.FC<ChatScreenProps> = ({navigation, route}) => {
  const {ticketId, isActive} = route.params;
  const dispatch = useDispatch<AppDispatch>();
  const messages = useSelector((state: RootState) => state.messages.messages);
  const loading = useSelector((state: RootState) => state.messages.loading);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ticket, setTicket] = useState<any>(null);
  const [creatorInfo, setCreatorInfo] = useState<UserInfo>({ name: '', color: '#8E8E93' });
  const [assigneeInfo, setAssigneeInfo] = useState<UserInfo>({ name: '', color: '#8E8E93' });
  const flatListRef = useRef<FlatList>(null);
  const [processedMessages, setProcessedMessages] = useState<any[]>([]);

  console.log('ChatScreen mounted');

  // Get current user ID and token from storage
  useEffect(() => {
    const fetchUserIdAndToken = async () => {
      const userId = await AsyncStorage.getItem('user_id');
      const t = await AsyncStorage.getItem('token');
      if (userId) setCurrentUserId(parseInt(userId, 10));
      if (t) setToken(t);
    };
    fetchUserIdAndToken();
  }, []);

  // Fetch ticket details
  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const data = await ticketService.getTicket(ticketId);
        setTicket(data);
      } catch (err) {
        Alert.alert('Error', 'Failed to load ticket details');
      }
    };
    fetchTicket();
  }, [ticketId]);

  // Fetch message history on mount
  useEffect(() => {
    if (!ticketId) return;
    const fetchMessages = async () => {
      dispatch(setLoading(true));
      try {
        const data = await messageService.getMessages(ticketId);
        dispatch(setMessages(
          data.map((msg: any) => ({
            id: msg.id.toString(),
            text: msg.content,
            isUser: msg.sender_id === currentUserId,
            timestamp: msg.timestamp
              ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '',
            sender_id: msg.sender_id,
            sender_name: msg.sender_name || (msg.sender_id === ticket?.creator_id ? creatorInfo.name : assigneeInfo.name) || '',
          }))
        ));
      } catch (err) {
        Alert.alert('Error', 'Failed to load messages');
      }
      dispatch(setLoading(false));
    };
    fetchMessages();
  }, [ticketId, currentUserId, dispatch, creatorInfo.name, assigneeInfo.name, ticket?.creator_id]);

  // Fetch participant names when ticket is loaded
  useEffect(() => {
    const fetchNames = async () => {
      if (ticket) {
        if (ticket.creator_id) {
          try {
            const [user, color] = await Promise.all([
              userService.getUser(ticket.creator_id),
              getUserColor(ticket.creator_id),
            ]);
            setCreatorInfo({ name: user.name || "", color });
          } catch {}
        }
        if (ticket.assignee_id) {
          try {
            const [user, color] = await Promise.all([
              userService.getUser(ticket.assignee_id),
              getUserColor(ticket.assignee_id),
            ]);
            setAssigneeInfo({ name: user.name || "", color });
          } catch {}
        }
      }
    };
    fetchNames();
  }, [ticket]);

  // WebSocket connection for real-time messaging
  useEffect(() => {
    console.log('WebSocket useEffect:', { isActive, currentUserId, token, ticketId, ticket });
    if (!isActive || !currentUserId || !token || !ticket) return;
    // Only allow if user is creator or assignee
    if (currentUserId !== ticket.creator_id && currentUserId !== ticket.assignee_id) {
      Alert.alert('Error', 'You are not a participant in this ticket.');
      return;
    }
    chatWebSocket.connect(ticketId, token);
    const handler = (data: any) => {
      console.log('WebSocket handler called with data:', data);
      dispatch(addMessage({
        id: data.id || `${Date.now()}-${Math.random()}`,
        text: data.content,
        isUser: data.sender_id === currentUserId,
        timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sender_id: data.sender_id,
        sender_name: data.sender_name || (data.sender_id === ticket?.creator_id ? creatorInfo.name : assigneeInfo.name) || '',
      }));
    };
    chatWebSocket.onMessage(handler);
    console.log('WebSocket handler set');
    return () => {
      console.log('ChatScreen cleanup');
      chatWebSocket.close();
    };
  }, [ticketId, isActive, currentUserId, token, ticket, dispatch, creatorInfo.name, assigneeInfo.name]);

  // Clear messages when ticketId changes
  useEffect(() => {
    dispatch(clearMessages());
  }, [ticketId, dispatch]);

  // Preprocess messages to insert date separators
  useEffect(() => {
    if (!messages || messages.length === 0) {
      setProcessedMessages([]);
      return;
    }
    const result: any[] = [];
    let lastDate: string | null = null;
    messages.forEach((msg) => {
      // Parse the date from the timestamp (assume timestamp is in 'HH:mm' or ISO format)
      let msgDateObj: Date;
      if (msg.timestamp && msg.timestamp.length > 10) {
        msgDateObj = new Date(msg.timestamp);
      } else {
        // fallback: today
        msgDateObj = new Date();
      }
      const dateLabel = getDateLabel(msgDateObj);
      if (dateLabel !== lastDate) {
        result.push({ type: 'date', date: dateLabel, key: `date-${dateLabel}-${msg.id}` });
        lastDate = dateLabel;
      }
      result.push({ ...msg, type: 'message', key: msg.id });
    });
    setProcessedMessages(result);
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !isActive || !currentUserId) return;
    dispatch(setLoading(true));
    try {
      chatWebSocket.sendMessage({
        content: newMessage.trim(),
      });
      setNewMessage('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerStyle: { 
        backgroundColor: '#fe6d00',
      },
      headerTitleStyle: { 
        color: '#fff', 
        fontWeight: '600', 
        fontSize: 18,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
      },
      headerTintColor: '#fff',
      headerTitleAlign: 'left',
      title: currentUserId === ticket?.creator_id ? assigneeInfo.name : creatorInfo.name,
      headerRight: () => (
        <Icon name="user" size={28} color="#fe6d00" style={{ marginRight: 16 }} />
      ),
    });
  }, [navigation, currentUserId, ticket, creatorInfo.name, assigneeInfo.name]);

  // Render function for FlatList (handles both messages and date separators)
  const renderItem = ({item, index}: {item: any, index: number}) => {
    if (item.type === 'date') {
      return (
        <View style={styles.dateSeparatorContainer}>
          <View style={styles.dateSeparatorBubble}>
            <Text style={styles.dateSeparatorText}>{item.date}</Text>
          </View>
        </View>
      );
    }
    const next = processedMessages[index + 1];
    const isLastInCluster = !next || next.type === 'date' || next.sender_id !== item.sender_id;
    const senderInfo = item.sender_id === ticket?.creator_id ? creatorInfo : assigneeInfo;
    if (item.isUser) {
      return (
        <View style={[styles.messageRow, { justifyContent: 'flex-end' }]}> 
          <View style={styles.messageBubbleUser}>
            <Text style={[styles.messageText, styles.userMessageText]}>{item.text}</Text>
            <Text style={[styles.timestamp, styles.userTimestamp]}>{item.timestamp}</Text>
          </View>
          {isLastInCluster ? (
            <View style={[styles.avatarCircleUser, { backgroundColor: senderInfo.color }]}>
              <Text style={styles.avatarText}>{getInitials(item.sender_name)}</Text>
            </View>
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
        </View>
      );
    } else {
      return (
        <View style={[styles.messageRow, { justifyContent: 'flex-start' }]}> 
          {isLastInCluster ? (
            <View style={[styles.avatarCircleOther, { backgroundColor: senderInfo.color }]}>
              <Text style={styles.avatarText}>{getInitials(item.sender_name)}</Text>
            </View>
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
          <View style={styles.messageBubbleOther}>
            <Text style={[styles.messageText, styles.otherMessageText]}>{item.text}</Text>
            <Text style={[styles.timestamp, styles.otherTimestamp]}>{item.timestamp}</Text>
          </View>
        </View>
      );
    }
  };

  // Scroll to bottom when messages update
  useEffect(() => {
    flatListRef.current?.scrollToEnd({animated: true});
  }, [processedMessages]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#fe6d00" barStyle="light-content" />
      
      {!isActive && (
        <View style={styles.disabledOverlay}>
          <Text style={styles.disabledText}>This chat is inactive</Text>
        </View>
      )}
      
      <FlatList
        ref={flatListRef}
        data={processedMessages}
        renderItem={({item, index}) => renderItem({item, index})}
        keyExtractor={item => item.key}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        showsVerticalScrollIndicator={false}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type your message..."
            placeholderTextColor="#8E8E93"
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={!newMessage.trim()}>
            {loading ? (
              <ActivityIndicator color="#007AFF" size="small" />
            ) : (
              <Icon name="arrow-with-circle-right" size={30} color="#fe6d00" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF4E6',
  },
  disabledOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  messageContainer: {
    marginVertical: 2,
    paddingHorizontal: 8,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubbleUser: {
    maxWidth: '55%',
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 2,
    backgroundColor: '#FFE4CC',
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  messageBubbleOther: {
    maxWidth: '55%',
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 2,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  userMessageText: {
    color: '#000000',
  },
  otherMessageText: {
    color: '#000000',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: '#667781',
  },
  otherTimestamp: {
    color: '#667781',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000',
  },
  sendButton: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledText: {
    color: '#B0B0B0',
  },
  dateSeparatorContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  dateSeparatorBubble: {
    backgroundColor: '#fe6d00',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignSelf: 'center',
    shadowColor: '#fe6d00',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  dateSeparatorText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  avatarCircleUser: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fe6d00',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  avatarCircleOther: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fe6d00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
    paddingHorizontal: 8,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    marginLeft: 8,
    marginRight: 8,
  },
});

export default ChatScreen;

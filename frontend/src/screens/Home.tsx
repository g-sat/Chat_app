/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  LayoutAnimation,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../../App';
// import {useFocusEffect} from '@react-navigation/native';
import { ticketService, userService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserColor } from '../common/colors';

type Ticket = {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'closed';
  isActive: boolean;
  creator_id: number;
  assignee_id: number;
};

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
  route: RouteProp<RootStackParamList, 'Home'>;
};

type UserInfo = {
  name: string;
  color: string;
};

type TicketInfo = {
  creator: UserInfo;
  assignee: UserInfo;
};

// Mock data for demo

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketDescription, setNewTicketDescription] = useState('');
  const [_loading, setLoading] = useState(false);
  const [newTicketPriority, setNewTicketPriority] = useState('NORMAL');
  const [assigneeId, setAssigneeId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [warning, setWarning] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [ticketUserInfos, setTicketUserInfos] = useState<{ [ticketId: number]: TicketInfo }>({});

  // Load tickets from AsyncStorage on mount, then fetch from backend
  useEffect(() => {
    const loadTickets = async () => {
      const stored = await AsyncStorage.getItem('tickets');
      if (stored) {
        setTickets(JSON.parse(stored));
      }
      fetchTickets();
    };
    loadTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await ticketService.getTickets();
      setTickets(data);
      await AsyncStorage.setItem('tickets', JSON.stringify(data));
    } catch (error) {
      // Handle error (e.g., show alert)
    }
    setLoading(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetchTickets();
    }, 5000); // every 5 seconds
  
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('user_id').then(id => {
      if (id) setCurrentUserId(Number(id));
    });
  }, []);

  useEffect(() => {
    tickets.forEach(ticket => {
      if ((ticket.creator_id || ticket.assignee_id) && !ticketUserInfos[ticket.id]) {
        const creatorPromise = ticket.creator_id ? 
          Promise.all([userService.getUser(ticket.creator_id), getUserColor(ticket.creator_id)]) : 
          Promise.resolve([null, '#ccc'] as [any, string]);
        
        const assigneePromise = ticket.assignee_id ? 
          Promise.all([userService.getUser(ticket.assignee_id), getUserColor(ticket.assignee_id)]) : 
          Promise.resolve([null, '#ccc'] as [any, string]);

        Promise.all([creatorPromise, assigneePromise]).then(([[creator, creatorColor], [assignee, assigneeColor]]) => {
          setTicketUserInfos(prev => ({
            ...prev,
            [ticket.id]: {
              creator: { name: creator?.name || '?', color: creatorColor || '#ccc' },
              assignee: { name: assignee?.name || '?', color: assigneeColor || '#ccc' },
            }
          }));
        }).catch(() => {
          setTicketUserInfos(prev => ({
            ...prev,
            [ticket.id]: {
              creator: { name: '?', color: '#8E8E93' },
              assignee: { name: '?', color: '#8E8E93' },
            }
          }));
        });
      }
    });
  }, [tickets, ticketUserInfos]);

  const createTicket = async () => {
    if (!newTicketTitle.trim() || !newTicketDescription.trim() || !newTicketPriority.trim() || !assigneeId) {
      setWarning('Please fill in all fields before creating a ticket.');
      return;
    }
    setWarning('');
    setLoading(true);
    try {
      const newTicket = await ticketService.createTicket({
        title: newTicketTitle.trim(),
        description: newTicketDescription.trim(),
        priority: newTicketPriority.trim() || "NORMAL",
        assignee_id: assigneeId && assigneeId > 0 ? assigneeId : null,
      });
      const updatedTickets = [newTicket, ...tickets];
      setTickets(updatedTickets);
      await AsyncStorage.setItem('tickets', JSON.stringify(updatedTickets));
      setNewTicketTitle('');
      setNewTicketDescription('');
      setNewTicketPriority('NORMAL');
      setAssigneeId(null);
      setShowCreateForm(false);
      navigation.navigate('Chat', { ticketId: newTicket.id, isActive: true });
    } catch (error: any) {
      console.error('Ticket creation error:', error);
      let message = 'Failed to create ticket.';
      if (error?.response?.data?.detail) message = error.response.data.detail;
      else if (error?.message) message = error.message;
      Alert.alert('Error', message);
    }
    setLoading(false);
  };

  const activateTicket = (ticketId: number) => {
    const updatedTickets = tickets.map(ticket => ({
      ...ticket,
      isActive: ticket.id === ticketId,
    }));
    setTickets(updatedTickets);
    AsyncStorage.setItem('tickets', JSON.stringify(updatedTickets));
    navigation.navigate('Chat', {ticketId, isActive: true});
  };

  // Add a function to close the currently open ticket
  const closeActiveTicket = async () => {
    const activeTicket = tickets.find(t => t.isActive && t.status === 'open');
    if (!activeTicket) return;
    try {
      await ticketService.updateTicketStatus(activeTicket.id, 'closed');
      const updatedTickets = tickets.map(ticket =>
        ticket.id === activeTicket.id
          ? { ...ticket, status: 'closed' as 'closed', isActive: false }
          : ticket
      );
      setTickets(updatedTickets);
      await AsyncStorage.setItem('tickets', JSON.stringify(updatedTickets));
    } catch (error) {
      const err = error as any;
      let message = 'Failed to close ticket.';
      if (err?.response?.data?.detail) message = err.response.data.detail;
      else if (err?.message) message = err.message;
      console.error('Close ticket error:', err);
      Alert.alert('Error', message);
    }
  };

  const openCreateForm = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowCreateForm(true);
    setWarning('');
  };

  const closeCreateForm = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowCreateForm(false);
    setNewTicketTitle('');
    setNewTicketDescription('');
    setNewTicketPriority('NORMAL');
    setAssigneeId(null);
    setWarning('');
  };

  function getInitials(name: string) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  const renderTicket = ({item}: {item: Ticket}) => {
    const info = ticketUserInfos[item.id];
    if (!info) return null; // Or show placeholder

    const otherParty = currentUserId === item.creator_id ? info.assignee : info.creator;

    return (
      <TouchableOpacity
        style={[
          styles.ticketCard,
          item.isActive && styles.activeTicketCard,
          item.status === 'closed' && styles.closedTicketCard,
        ]}
        onPress={() => activateTicket(item.id)}>
        <View style={styles.ticketHeaderRow}>
          <View style={[styles.avatarCircle, { backgroundColor: otherParty.color }]}>
            <Text style={styles.avatarText}>{getInitials(otherParty.name)}</Text>
          </View>
          <View style={{ flex: 1, marginRight: 4 }}>
            <Text style={styles.ticketTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.associatedWithText} numberOfLines={1}>
              Chat with: {otherParty.name}
            </Text>
          </View>
          <View style={[
            styles.statusBadge,
            item.status === 'closed' && styles.closedStatusBadge,
          ]}>
            <Text style={[
              styles.statusText,
              item.status === 'closed' && styles.closedStatusText,
            ]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
          {item.isActive && (
            <Text style={styles.activeIndicatorText}>●</Text>
          )}
        </View>
        <Text style={styles.ticketDescription} numberOfLines={1}>
          {item.description}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}>
        {tickets.some(t => t.status === 'open') ? (
          <View style={styles.createTicketContainer}>
            <Text style={styles.openTicketWarning}>
              You have an open ticket. Please close it to create a new one.
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeActiveTicket}
            >
              <Text style={styles.closeButtonText}>Close Active Ticket</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.createTicketContainer}>
            {!showCreateForm ? (
              <TouchableOpacity style={styles.fabCreateButton} onPress={openCreateForm}>
                <Text style={styles.fabCreateButtonIcon}>＋</Text>
                <Text style={styles.fabCreateButtonText}>Create Ticket</Text>
              </TouchableOpacity>
            ) : (
              <View>
                <Text style={styles.createTitle}>Create Ticket</Text>
                {warning ? <Text style={styles.warningText}>{warning}</Text> : null}
                <TextInput
                  style={styles.input}
                  placeholder="Order Title"
                  value={newTicketTitle}
                  onChangeText={setNewTicketTitle}
                  placeholderTextColor="#8E8E93"
                  maxLength={40}
                />
                <TextInput
                  style={[styles.input, styles.descriptionInput]}
                  placeholder="Order Description"
                  value={newTicketDescription}
                  onChangeText={setNewTicketDescription}
                  placeholderTextColor="#8E8E93"
                  multiline
                  maxLength={80}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Priority (e.g. NORMAL, HIGH, LOW)"
                  value={newTicketPriority}
                  onChangeText={setNewTicketPriority}
                  placeholderTextColor="#8E8E93"
                  maxLength={10}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Assignee ID (number)"
                  value={assigneeId ? assigneeId.toString() : ""}
                  onChangeText={text => setAssigneeId(text ? Number(text) : null)}
                  placeholderTextColor="#8E8E93"
                  keyboardType="numeric"
                  maxLength={6}
                />
                <View style={styles.formButtonRow}>
                  <TouchableOpacity
                    style={styles.bigCreateButton}
                    onPress={createTicket}
                  >
                    <Text style={styles.bigCreateButtonText}>Create</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} onPress={closeCreateForm}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {tickets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎫</Text>
            <Text style={styles.emptyText}>No tickets found</Text>
          </View>
        ) : (
          <FlatList
            data={tickets}
            renderItem={renderTicket}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.ticketsList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  createTicketContainer: {
    margin: 10,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    shadowColor: '#fe6d00',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 6,
  },
  createTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fe6d00',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  input: {
    backgroundColor: '#F5F0EB',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    fontSize: 14,
    color: '#212529',
    borderWidth: 1,
    borderColor: '#E8DCC8',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  descriptionInput: {
    height: 48,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: '#fe6d00',
    borderRadius: 16,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 2,
  },
  createButtonDisabled: {
    backgroundColor: '#C7C7CC',
    opacity: 0.7,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  closeButton: {
    backgroundColor: '#dc3545',
    borderRadius: 16,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 2,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  openTicketWarning: {
    color: '#dc3545',
    marginBottom: 6,
    fontWeight: '600',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  ticketsList: {
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8DCC8',
    shadowColor: '#fe6d00',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
    position: 'relative',
  },
  activeTicketCard: {
    borderColor: '#fe6d00',
    borderWidth: 2,
    shadowOpacity: 0.12,
  },
  closedTicketCard: {
    opacity: 0.5,
  },
  ticketHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ticketTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#212529',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  statusBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 40,
    alignItems: 'center',
    marginRight: 4,
  },
  closedStatusBadge: {
    backgroundColor: '#6c757d',
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 0.3,
  },
  closedStatusText: {
    color: '#fff',
  },
  activeIndicatorText: {
    color: '#fe6d00',
    fontSize: 13,
    fontWeight: '900',
    marginLeft: 2,
    marginTop: 1,
  },
  ticketDescription: {
    fontSize: 12,
    color: '#495057',
    marginBottom: 0,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  formButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  bigCreateButton: {
    flex: 1,
    backgroundColor: '#fe6d00',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#fe6d00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  bigCreateButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 1,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#C7C7CC',
    shadowColor: '#C7C7CC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
  },
  cancelButtonText: {
    color: '#8E8E93',
    fontSize: 20,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 1,
  },
  warningText: {
    color: '#dc3545',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  fabCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: '#fe6d00',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginVertical: 8,
    shadowColor: '#fe6d00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  fabCreateButtonIcon: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginRight: 10,
    marginTop: -2,
  },
  fabCreateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  avatarCircle: {
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
  associatedWithText: {
    fontSize: 13,
    color: '#6c757d',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    marginTop: 2,
  },
});

export default HomeScreen;

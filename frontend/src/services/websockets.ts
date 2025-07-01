export type MessageHandler = (msg: any) => void;

// Use the same base URL as API service
const WS_BASE_URL = 'ws://10.0.2.2:8000';

class ChatWebSocket {
  private ws: WebSocket | null = null;
  private handler: MessageHandler | null = null;

  connect(ticketId: number, token: string) {
    const wsUrl = `${WS_BASE_URL}/ws/ticket/${ticketId}?token=${token}`;
    console.log('Connecting to WebSocket:', wsUrl);
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connection established');
    };

    this.ws.onmessage = (event) => {
      try {
        // Example backend message: "123:hello|12:34 PM|Alice"
        const [userAndContent, timestamp, senderName] = event.data.split('|');
        const [sender_id, content] = userAndContent.split(':');
        const data = {
          sender_id: Number(sender_id),
          content,
          timestamp,
          sender_name: senderName,
        };
        console.log('WebSocket message received:', data);
        if (this.handler) this.handler(data);
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };
    this.ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
    this.ws.onerror = (e) => {
      console.error('WebSocket error:', e);
    };
  }

  sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Only send the content as a string
      this.ws.send(message.content);
    }
  }

  onMessage(handler: MessageHandler) {
    this.handler = handler;
  }

  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.handler = null;
  }
}

export const chatWebSocket = new ChatWebSocket(); 
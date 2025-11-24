import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your AI assistant powered by GPT-4o Mini. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${error.message}` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.chatContainer}>
        <div style={styles.header}>
          <h1 style={styles.title}>AI Assistant</h1>
          <p style={styles.subtitle}>Powered by GPT-4o Mini</p>
        </div>
        
        <div style={styles.messagesContainer}>
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                ...styles.message,
                ...(msg.role === 'user' ? styles.userMessage : styles.botMessage)
              }}
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div style={{...styles.message, ...styles.botMessage}}>
              AI is thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={styles.inputContainer}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            style={styles.input}
            disabled={loading}
          />
          <button 
            onClick={sendMessage} 
            style={styles.button}
            disabled={loading || !input.trim()}
          >
            Send
          </button>
        </div>
      </div>

      <style jsx>{`
        .container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    width: '100%',
    maxWidth: '800px',
    background: 'white',
    borderRadius: '15px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '80vh',
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '20px',
    textAlign: 'center',
  },
  title: {
    margin: '0 0 5px 0',
    fontSize: '1.5em',
  },
  subtitle: {
    margin: 0,
    opacity: 0.9,
    fontSize: '0.9em',
  },
  messagesContainer: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    background: '#f8f9fa',
  },
  message: {
    marginBottom: '15px',
    padding: '12px 16px',
    borderRadius: '18px',
    maxWidth: '70%',
    wordWrap: 'break-word',
  },
  userMessage: {
    background: '#007bff',
    color: 'white',
    marginLeft: 'auto',
    borderBottomRightRadius: '5px',
  },
  botMessage: {
    background: 'white',
    border: '1px solid #dee2e6',
    borderBottomLeftRadius: '5px',
    marginRight: 'auto',
  },
  inputContainer: {
    padding: '20px',
    background: 'white',
    borderTop: '1px solid #dee2e6',
    display: 'flex',
    gap: '10px',
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '25px',
    outline: 'none',
    fontSize: '14px',
  },
  button: {
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    padding: '12px 24px',
    cursor: 'pointer',
    fontSize: '14px',
  },
};
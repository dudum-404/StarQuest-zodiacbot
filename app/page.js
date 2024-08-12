"use client";
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hey, welcome to StarQuest! What is your preferred language?",
    },
  ]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null); // Ref for scrolling

  // Initialize Audio objects
  const [audioObjects, setAudioObjects] = useState({
    userSendSound: null,
    botSendSound: null,
    buttonClickSound: null,
  });

  useEffect(() => {
    // Only run in the browser
    const userSendSound = new Audio('/user_send.mp3');
    const botSendSound = new Audio('/bot_send.mp3');
    const buttonClickSound = new Audio('/button_click.mp3');

    setAudioObjects({
      userSendSound,
      botSendSound,
      buttonClickSound,
    });
  }, []);

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    setIsLoading(true);

    // Play button click sound
    audioObjects.buttonClickSound?.play();

    setMessage('');
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' },
    ]);

    // Play user send sound
    audioObjects.userSendSound?.play();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...messages, { role: 'user', content: message }]),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ];
        });
      }

      // Play bot send sound
      audioObjects.botSendSound?.play();

    } catch (error) {
      console.error('Error:', error);
      setMessages((messages) => [
        ...messages,
        { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
    >
      <Stack
        direction={'column'}
        width="500px"
        height="calc(100% - 60px)" // Adjust height to account for footer
        border="1px solid black"
        p={2}
        spacing={3}
        borderRadius={10} // Rounded chat box
        margin="0 auto" // Center the chat box
      >
        <Stack
          direction={'column'}
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
              alignItems="center"
            >
              {message.role === 'assistant' && (
                <img
                  src='/bot.png'
                  alt="Bot"
                  style={{ width: 50, height: 50, borderRadius: '30%', marginRight: 8 }}
                />
              )}
              <Box
                bgcolor={
                  message.role === 'assistant'
                    ? 'rgba(128, 128, 128, 0.2)' // Gray transparent color for bot chat
                    : 'rgba(204, 153, 255, 0.2)' // Light purple color for user reply
                }
                color="black"
                borderRadius={16}
                p={3}
                maxWidth="70%" // Restrict the max width of messages
                wordWrap="break-word" // Ensure long messages break and wrap properly
              >
                {message.content}
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} /> {/* Scroll target */}
        </Stack>
        <Stack direction={'row'} spacing={2}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <Button 
            variant="contained" 
            onClick={sendMessage}
            disabled={isLoading}
            style={{ borderRadius: 16, backgroundColor: 'lightblue' }} 
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </Stack>
      </Stack>

      {/* Footer */}
      <Box
        width="100%"
        bgcolor="rgba(128, 128, 128, 0.1)" // Light gray background
        p={1}
        textAlign="center"
        borderTop="1px solid #ddd"
        position="absolute"
        bottom={0}
      >
        <Typography variant="body2" color="textSecondary">
          Made with Next.js and deployed with Vercel
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Assets used from: Flaticon, Mixkit.co, <a href="https://codepen.io/mohaiman/pen/MQqMyo" target="_blank" rel="noopener noreferrer">CodePen</a>
        </Typography>
      </Box>
    </Box>
  );
}

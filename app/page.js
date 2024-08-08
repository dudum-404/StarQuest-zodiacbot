'use client'

import { Box, Button, Stack, TextField } from '@mui/material'
import { useState, useRef, useEffect } from 'react'

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Yooo What's Up?. How was your day?",
    },
  ])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null) // Ref for scrolling

  // Load the mp3 sounds
  const userSendSound = new Audio('/user_send.mp3')
  const botSendSound = new Audio('/bot_send.mp3')
  const buttonClickSound = new Audio('/button_click.mp3')

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    setIsLoading(true)

    // Play button click sound
    buttonClickSound.play()

    setMessage('')
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' },
    ])

    // Play user send sound
    userSendSound.play()

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...messages, { role: 'user', content: message }]),
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1]
          let otherMessages = messages.slice(0, messages.length - 1)
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ]
        })
      }

      // Play bot send sound
      botSendSound.play()

    } catch (error) {
      console.error('Error:', error)
      setMessages((messages) => [
        ...messages,
        { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Stack
        direction={'column'}
        width="500px"
        height="700px"
        border="1px solid black"
        p={2}
        spacing={3}
        borderRadius={10} // Rounded chat box
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
    </Box>
  )
}

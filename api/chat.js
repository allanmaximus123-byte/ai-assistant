export default async function handler(req, res) {
  // Enable CORS for all regions
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Create a thread and run with your Assistant
      const openaiResponse = await fetch('https://api.openai.com/v1/threads/runs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          assistant_id: process.env.ASSISTANT_ID, // Your specific Assistant
          thread: {
            messages: [
              {
                role: 'user',
                content: message
              }
            ]
          }
        })
      });

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        throw new Error(`OpenAI API error: ${errorText}`);
      }

      const runData = await openaiResponse.json();
      const threadId = runData.thread_id;
      const runId = runData.id;

      // Poll for completion (wait for Assistant response)
      let runStatus = runData.status;
      let attempts = 0;
      const maxAttempts = 30;

      while ((runStatus === 'in_progress' || runStatus === 'queued') && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        });

        if (!statusResponse.ok) {
          throw new Error(`Failed to check run status: ${await statusResponse.text()}`);
        }

        const statusData = await statusResponse.json();
        runStatus = statusData.status;
        attempts++;

        if (runStatus === 'completed') {
          break;
        } else if (runStatus === 'failed' || runStatus === 'cancelled') {
          throw new Error(`Assistant run ${runStatus}: ${statusData.last_error?.message || 'Unknown error'}`);
        }
      }

      if (runStatus !== 'completed') {
        throw new Error('Assistant response timed out');
      }

      // Get the Assistant's response
      const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      if (!messagesResponse.ok) {
        throw new Error(`Failed to get messages: ${await messagesResponse.text()}`);
      }

      const messagesData = await messagesResponse.json();
      
      // Find the Assistant's message (most recent assistant message)
      const assistantMessage = messagesData.data
        .reverse()
        .find(msg => msg.role === 'assistant')
        ?.content[0]?.text?.value || 'No response from assistant';

      res.json({ reply: assistantMessage });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}


export const params = {
  option1: {
    message: '',
    messageHistory: '',
    kontekst: '',
    model: 'gpt-4o',
    base64String: ''
  },
  option2: {
    question: '',
    parameters: {
      stream: false,
      max_tokens: 500,
      max_new_tokens: 1024,
      top_k: 64,
      top_p: 0.9,
      stop: ['<|im_end|>'],
      temperature: 0.2,
      do_sample: true,
      repetition_penalty: 1.0,
      return_full_text: true
    }
  },
  option3: { // Matematikkens byggesteiner
    message: '',
    kontekst: '',
    model: 'gpt-4o',
    assistant_id: import.meta.env.VITE_ASSISTANT_MB,
    new_thread: true,
    thread_id: ''
    },
    option4: { // Teoretisk matematikk 1
    message: '',
    kontekst: '',
    model: 'gpt-4o',
    assistant_id: import.meta.env.VITE_ASSISTANT_TM1,
    new_thread: true,
    thread_id: ''
  },
  option5: { // Teoretisk matematikk 2
    message: '',
    kontekst: '',
    model: 'gpt-4o',
    assistant_id: import.meta.env.VITE_ASSISTANT_TM2,
    new_thread: true,
    thread_id: ''
  },
  option6: { // Brukes ikke
    message: '',
    kontekst: '',
    model: 'gpt-4o',
    assistant_id: '',
    new_thread: true,
    thread_id: ''
  },
  option7: { // VTR
    message: '',
    kontekst: '',
    model: 'gpt-4o',
    assistant_id:'',
    new_thread: true,
    thread_id: ''
  },
  option8: { // Geologi
    message: '',
    kontekst: '',
    model: 'gpt-4o',
    assistant_id: import.meta.env.VITE_ASSISTANT_GEOLOGI,
    new_thread: true,
    thread_id: ''
  },
  option9: { // o1-preview
    message: '',
    messageHistory: '',
    kontekst: '',
    model: 'o1-preview',
    base64String: ''
  },
  option10: { // Skogmo - Elev
    message: '',
    kontekst: '',
    model: 'gpt-4o',
    assistant_id: import.meta.env.VITE_ASSISTANT_SKOGMO_ELEV,
    new_thread: true,
    thread_id: ''
  },
  option11: { // Skogmo - Lærer
    message: '',
    kontekst: '',
    model: 'gpt-4o',
    assistant_id: import.meta.env.VITE_ASSISTANT_SKOGMO_LAERER,
    new_thread: true,
    thread_id: ''
  },
  option12: {
    message: '',
    kontekst: '',
    model: 'gpt-4o',
    assistant_id: '',
    new_thread: true,
    thread_id: ''
  },
  option13: {
    message: '',
    kontekst: '',
    model: 'pixtral-large-latest',
    assistant_id: '',
    new_thread: false,
    thread_id: ''
  }
}

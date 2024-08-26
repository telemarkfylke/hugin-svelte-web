// Parametre som sendes til backend og api
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
  option3: {
    message: '',
    kontekst: '',
    model: 'gpt-4o',
    assistant_id: 'asst_masx2DR1ynqNvP308OWlKzix',
    new_thread: true,
    thread_id: ''
  },
  option4: {
    message: '',
    kontekst: '',
    model: 'gpt-4o',
    assistant_id: 'asst_r7NROIPTuk2OME5sElp4ORSl',
    new_thread: true,
    thread_id: ''
  },
  option5: {
    message: '',
    kontekst: '',
    model: 'gpt-4o',
    assistant_id: 'asst_iZz9L7JGhfTgjdgXDeR5SsgJ',
    new_thread: true,
    thread_id: ''
  },
  option6: {
    message: '',
    kontekst: '',
    model: 'gpt-4o',
    assistant_id: 'asst_PjgBFDXTELeMF6vXKvhlOZrH',
    new_thread: true,
    thread_id: ''
  },
  option7: {
    message: '',
    kontekst: '',
    model: 'gpt-4o',
    assistant_id: 'asst_kleLVY0hLwXAgcgxoBgzwqLA',
    new_thread: true,
    thread_id: ''
  },
  option8: {
    message: '',
    kontekst: '',
    model: 'gpt-4o',
    assistant_id: 'asst_mkb3jLMrZ7g04S6xfQ7aySxw',
    new_thread: true,
    thread_id: ''
  }
}

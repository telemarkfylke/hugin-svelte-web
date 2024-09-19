// Bibliotek for å håndtere API-kall til AZF-funksjoner
import axios from 'axios'
import { params } from '$lib/data/modelparams'
import { getHuginToken } from '../useApi'

export const multimodalOpenAi = async (userParams) => {
  // Template API-call
  const payload = params[userParams.valgtModell]
  payload.message = userParams.message
  payload.messageHistory = userParams.messageHistory
  payload.kontekst = userParams.kontekst
  payload.temperatur = userParams.temperatur
  payload.bilde_base64String = userParams.base64String

  const accessToken = await getHuginToken()
  // Call AZF-funksjon with payload
  const response = await axios.post(`${import.meta.env.VITE_AI_API_URI}/multimodalOpenAi`, payload, {
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  })
  return response.data.choices[0].message.content
}

export const noraChat = async (modellInfo) => {
  // Sjekker om det er hverdag mellom 09:00 og 16:00
  const isWeekday = (date = new Date()) => date.getDay() % 6 !== 0
  const isDaytime = (date = new Date()) => date.getHours() >= 9 && date.getHours() < 16
  console.log(isWeekday(), isDaytime())
  // Messagehandling
  const payload = params[modellInfo.valgtModell]
  const indexLastMessage = modellInfo.messageHistory.length - 1
  payload.question = modellInfo.messageHistory[indexLastMessage].content

  const accessToken = await getHuginToken()
  if (isWeekday() && isDaytime()) {
    const response = await axios.post(`${import.meta.env.VITE_AI_API_URI}/noraChat`, payload, {
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    })
    return response.data
  } else {
    return 'Nora er tilgjengelig på hverdager mellom 09:00 og 16:00. Prøv igjen senere.'
  }
}

export const openAiAssistant = async (userParams) => {
  const payload = {
    assistant_id: params[userParams.valgtModell].assistant_id,
    new_thread: userParams.newThread,
    thread_id: userParams.threadId,
    messageHistory: userParams.messageHistory,
    vectorStore_id: ''
  }

  const accessToken = await getHuginToken()

  const response = await axios.post(`${import.meta.env.VITE_AI_API_URI}/assistantOpenAi`, payload, {
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  })
  return response.data
}

export const docQueryOpenAi = async (filliste, up) => {
  // Template API-call
  const payload = {
    assistant_id: 'asst_Rey678W0eAv6ZXl7uGzTMkL4',
    new_thread: up.newThread,
    vectorStore_id: up.vectorStoreId,
    thread_id: up.threadId,
    filer: filliste
  }

  const datapakken = new FormData()
  datapakken.append('assistant_id', payload.assistant_id)
  datapakken.append('thread_id', payload.thread_id)
  datapakken.append('new_thread', payload.new_thread)
  datapakken.append('vectorStore_id', payload.vectorStore_id)
  datapakken.append('message', up.message)
  datapakken.append('filer', filliste[0])

  const accessToken = await getHuginToken()

  const r = await axios.post(`${import.meta.env.VITE_AI_API_URI}/docQueryOpenAiV2`, datapakken, {
    method: 'post',
    data: datapakken,
    headers: {
      'Content-Type': 'multipart/form-data',
      authorization: `Bearer ${accessToken}`
    }
  })
  payload.assistant_id = r.data.assistant_id
  payload.thread_id = r.data.thread_id
  payload.vectorStore_id = r.data.vectorStore_id
  payload.new_thread = 'false'
  return JSON.stringify(r)
}

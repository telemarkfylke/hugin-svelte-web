// Bibliotek for å håndtere API-kall til AZF-funksjoner
import axios from 'axios'
import { params } from '$lib/data/modelparams'
import { getHuginToken } from '../useApi'

export const multimodalMistral = async (userParams) => {
    console.log("Mistral in the making")
    // Template API-call
    const payload = params[userParams.valgtModell]
    payload.messageHistory = userParams.messageHistory
    payload.kontekst = userParams.kontekst
    payload.temperatur = userParams.temperatur
    payload.bilde_base64String = userParams.base64String
    console.log("Payload: ", payload)
    const accessToken = await getHuginToken()
    // Call AZF-funksjon with payload
    const response = await axios.post(`${import.meta.env.VITE_AI_API_URI}/multimodalMistral`, payload, {
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    })
    // return response.data.choices[0].message.content
    console.log("Response: ", response.data.choices[0].message.content)
    return response.data.choices[0].message.content
  }
// Bibliotek for å håndtere API-kall til AZF-funksjoner

import axios from 'axios';
import { params } from '$lib/data/modelparams';
import { env } from '$env/dynamic/public'

export const openAiSimpleChat = async (modellInfo) => {
    // Template API-call
    let payload = params[modellInfo.valgtModell];
    payload.message = modellInfo.message;
    payload.kontekst = modellInfo.kontekst;
    console.log(payload);

    const response = await axios.post(env.PUBLIC_LOCAL_OPENAICHAT , payload)
    console.log(response, env.PUBLIC_TEST ); // Tester env-handling
    return response.data.choices[0].message.content;
}

export const noraChat = async (modellInfo) => {
    // Template API-call
    let payload = params[modellInfo.valgtModell];
    payload.question = modellInfo.message;
    console.log(payload);

    const response = await axios.post(env.PUBLIC_LOCAL_NORACHAT, payload)
    console.log(response, env.PUBLIC_TEST ); // Tester env-handling
    return response.data;
}

export const openAiAssistant = async (modellInfo) => {
    // Template API-call
    let payload = {
        "assistant_id": "asst_BJazzPrqisexDOnT6GfE76jY",
        "new_thread": true,
        "thread_id": "thread_a2YfpinOlgziNSj7K6tmGBbj",
        "question": modellInfo.message
    }

    $: console.log(payload);

    const response = await axios.post(env.PUBLIC_LOCAL_OPENAIASSISTANT, payload)
    $: console.log(response.data.messages[1].content[0].text.value);
    return response.data.messages[1].content[0].text.value;
}

export const visionOpenAi = async (modellInfo) => {
    // Template API-call
    let payload = {
        "model": "gpt-4-turbo",
        "question": modellInfo.message,
        "bilde_url": modellInfo.kontekst
      }

    $: console.log(payload);

    const response = await axios.post(env.PUBLIC_LOCAL_OPENAIVISION, payload)
    $: console.log(response.data.message.content);
    return response.data.message.content;
}
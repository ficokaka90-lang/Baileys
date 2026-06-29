
import { generateWAMessageFromContent, prepareWAMessageMedia } from '../Utils'

function buildNativeFlowButtons(buttons) {
  return buttons.map((btn) => {
    switch (btn.type) {
      case 'quick_reply':
        return { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: btn.text, id: btn.id || btn.text }) }
      case 'cta_url':
        return { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: btn.text, url: btn.url, merchant_url: btn.url }) }
      case 'cta_call':
        return { name: 'cta_call', buttonParamsJson: JSON.stringify({ display_text: btn.text, id: btn.phoneNumber }) }
      case 'cta_copy':
        return { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: btn.text, copy_code: btn.copyText, id: btn.copyText }) }
      case 'single_select':
        return { name: 'single_select', buttonParamsJson: JSON.stringify({ title: btn.title, sections: btn.sections }) }
      default:
        throw new Error('Unknown button type: ' + btn.type)
    }
  })
}

export async function sendButtonMessage(sock, jid, content, options = {}) {
  const nativeFlowButtons = buildNativeFlowButtons(content.buttons)

  let headerMedia = {}
  if (content.image) headerMedia = await prepareWAMessageMedia({ image: content.image }, { upload: sock.waUploadToServer })
  else if (content.video) headerMedia = await prepareWAMessageMedia({ video: content.video }, { upload: sock.waUploadToServer })

  const interactiveMessage = {
    body: { text: content.text || '' },
    footer: content.footer ? { text: content.footer } : undefined,
    header: {
      title: content.title || '',
      subtitle: content.subtitle || '',
      hasMediaAttachment: !!(content.image || content.video),
      ...headerMedia
    },
    nativeFlowMessage: { buttons: nativeFlowButtons, messageParamsJson: '' }
  }

  const msg = generateWAMessageFromContent(
    jid,
    { viewOnceMessage: { message: { interactiveMessage } } },
    { userJid: sock.user && sock.user.id, ...options }
  )

  await sock.relayMessage(jid, msg.message, { messageId: msg.key.id })
  return msg
}

export async function sendListMessage(sock, jid, content, options = {}) {
  return sendButtonMessage(sock, jid, {
    text: content.text,
    title: content.title,
    footer: content.footer,
    buttons: [{ type: 'single_select', title: content.buttonText, sections: content.sections }]
  }, options)
}

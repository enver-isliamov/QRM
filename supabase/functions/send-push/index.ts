import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  try {
    const body = await req.json()
    
    // 1. Обработка Webhook от Telegram (сообщения от пользователей)
    if (body.message) {
      const chatId = body.message.chat.id
      const text = body.message.text || ''
      const userId = body.message.from.id

      // Команда /start 123456 (привязка аккаунта)
      if (text.startsWith('/start ')) {
        const authCode = text.split(' ')[1]
        
        // Ищем пользователя по коду в БД
        const res = await fetch(`${SUPABASE_URL}/rest/v1/telegram_users?auth_code=eq.${authCode}&select=user_id,auth_code_expires_at`, {
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          }
        })
        const data = await res.json()
        const userLink = data[0]

        if (userLink && new Date(userLink.auth_code_expires_at) > new Date()) {
          // Привязываем аккаунт
          await fetch(`${SUPABASE_URL}/rest/v1/telegram_users?user_id=eq.${userLink.user_id}`, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              telegram_id: userId,
              chat_id: chatId,
              auth_code: null, // Сбрасываем код
              auth_code_expires_at: null
            })
          })

          await sendTelegramMessage(chatId, '✅ Аккаунт успешно привязан! Теперь вы будете получать уведомления здесь.')
        } else {
          await sendTelegramMessage(chatId, '❌ Неверный или просроченный код. Пожалуйста, сгенерируйте новый код в профиле приложения.')
        }
      } else {
        const welcomeMsg = `👋 *Салям!* Я бот приложения *ORAZA*.\n\n` +
          `Я буду присылать вам уведомления о:\n` +
          `• 🔔 Новых откликах на ваши обращения в Ярдым\n` +
          `• 📅 Изменениях во встречах сёл, на которые вы подписаны\n` +
          `• 💬 Упоминаниях в комментариях\n\n` +
          `Чтобы начать получать уведомления, сгенерируйте код в вашем профиле в приложении и отправьте его мне командой:\n` +
          `\`/start ВАШ_КОД\``
        await sendTelegramMessage(chatId, welcomeMsg, 'Markdown')
      }
    }

    // 2. Обработка уведомлений от триггера БД (отправка сообщения пользователю)
    if (body.record) {
      const { user_id, title, body: msgBody, link } = body.record

      // Ищем chat_id пользователя
      const res = await fetch(`${SUPABASE_URL}/rest/v1/telegram_users?user_id=eq.${user_id}&select=chat_id`, {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      })
      const data = await res.json()
      const chat = data[0]

      if (chat && chat.chat_id) {
        const message = `🔔 *${title}*\n\n${msgBody}\n\n🔗 [Открыть в приложении](https://orazaru.vercel.app${link || '/'})`
        await sendTelegramMessage(chat.chat_id, message, 'Markdown')
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    console.error('Error in telegram-bot function:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})

async function sendTelegramMessage(chatId: number, text: string, parseMode?: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: parseMode
    })
  })
}

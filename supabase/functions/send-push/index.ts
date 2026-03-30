import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import webpush from "https://esm.sh/web-push@3.6.6"

const PUBLIC_KEY = Deno.env.get('PUSH_PUBLIC_KEY')
const PRIVATE_KEY = Deno.env.get('PUSH_PRIVATE_KEY')

webpush.setVapidDetails(
  'mailto:support@oraza.ru',
  PUBLIC_KEY,
  PRIVATE_KEY
)

serve(async (req) => {
  try {
    const { record } = await req.json()
    
    // record - это строка из таблицы user_notifications
    const { user_id, title, body, link } = record

    // 1. Получаем подписки пользователя из БД
    // Примечание: Здесь нужен Service Role Key для обхода RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    const fetchRes = await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?user_id=eq.${user_id}&select=subscription`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    })
    
    const subscriptions = await fetchRes.json()

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: 'No subscriptions found' }), { status: 200 })
    }

    // 2. Рассылаем уведомления
    const payload = JSON.stringify({ title, body, url: link || '/' })
    
    const sendPromises = subscriptions.map((s: any) => 
      webpush.sendNotification(s.subscription, payload).catch((err: any) => {
        console.error('Error sending push:', err)
        // Если подписка протухла (404 или 410), её стоит удалить
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Логика удаления...
        }
      })
    )

    await Promise.all(sendPromises)

    return new Response(JSON.stringify({ success: true }), { 
      headers: { "Content-Type": "application/json" },
      status: 200 
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { "Content-Type": "application/json" },
      status: 400 
    })
  }
})

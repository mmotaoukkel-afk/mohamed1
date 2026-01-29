import { sendBroadcast, triggerAdminAlert } from './src/services/adminNotificationService';

async function runTest() {
    console.log('🚀 Starting notification test...');

    // 1. Send Broadcast (Marketing)
    console.log('📢 Sending Broadcast...');
    await sendBroadcast({
        title: 'تخفيضات نهاية الأسبوع! ✨',
        body: 'استمتعوا بخصم 20% على جميع منتجات العناية بالبشرة. الكود: WEEKEND20',
    });

    // 2. Send Admin Alert (System)
    console.log('🚨 Sending Admin Alert...');
    await triggerAdminAlert({
        type: 'order',
        title: 'طلب جديد! 🛍️',
        body: 'قام زبون جديد بطلب منتجات بقيمة 45.000 د.ك',
        data: { orderId: 'TEST-123' }
    });

    console.log('✅ Test notifications triggered.');
}

runTest().catch(console.error);

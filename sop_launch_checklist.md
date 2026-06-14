# 🚀 SOP: إطلاق تطبيق Kataraa — حالة التنفيذ

> آخر تحديث: مارس 2026 | Branch: `mohamed`

---

## أسطورة الرموز

| رمز | المعنى |
|-----|---------|
| ✅ | مكتمل |
| ⚠️ | موجود جزئياً / يحتاج تحسين |
| ❌ | غير موجود — يجب البناء |

---

## 1. Dashboard (لوحة التحكم)

### 1.1 المتطلبات الأساسية

| البند | الحالة | ملاحظة |
|-------|--------|---------|
| عرض الإحصائيات (طلبات / أرباح / مستخدمين) | ✅ | [adminAnalyticsService.js](file:///c:/Users/PC/Documents/app/first-app/src/services/adminAnalyticsService.js) + `overview.jsx` |
| إدارة المنتجات (إضافة / تعديل / حذف) | ✅ | [adminProductService.js](file:///c:/Users/PC/Documents/app/first-app/src/services/adminProductService.js) + `AddProductModal.jsx` |
| إدارة الطلبات | ✅ | [adminOrderService.js](file:///c:/Users/PC/Documents/app/first-app/src/services/adminOrderService.js) + [orders.jsx](file:///c:/Users/PC/Documents/app/first-app/app/orders.jsx) |
| Analytics يومي / شهري | ✅ | [adminAnalytics.js](file:///c:/Users/PC/Documents/app/first-app/src/services/adminAnalytics.js) |

### 1.2 نظام الصلاحيات (RBAC)

| البند | الحالة | ملاحظة |
|-------|--------|---------|
| Admin / Staff roles | ✅ | [role.guard.js](file:///c:/Users/PC/Documents/app/first-app/src/guards/role.guard.js) — [useAdminGuard](file:///c:/Users/PC/Documents/app/first-app/src/guards/role.guard.js#24-77) / [useAuthGuard](file:///c:/Users/PC/Documents/app/first-app/src/guards/role.guard.js#78-111) |
| حماية Routes في Frontend | ✅ | Guards مطبقة على جميع صفحات admin |
| التحقق من role في Backend (Firestore Rules) | ✅ | [firestore.rules](file:///c:/Users/PC/Documents/app/first-app/firestore.rules) — `hasAdminAccess()` |
| Staff بصلاحيات محدودة (manager / support) | ⚠️ | الـ roles موجودة في Rules لكن UI لا يفرق بينها |

### 1.3 Activity Logs (سجل العمليات)

| البند | الحالة | ملاحظة |
|-------|--------|---------|
| Collection `adminLogs` في Firestore | ✅ | محدد في [firestore.rules](file:///c:/Users/PC/Documents/app/first-app/firestore.rules) |
| تسجيل من عدّل منتج / حذف طلب | ❌ | لا يوجد كود يكتب في `adminLogs` |
| واجهة عرض Logs في Dashboard | ❌ | صفحة Logs غير موجودة |

> **🔴 خطوة مطلوبة:** إضافة `logActivity()` function تُستدعى عند كل عملية Admin مهمة.

### 1.4 Real-time Updates

| البند | الحالة | ملاحظة |
|-------|--------|---------|
| Firebase Realtime / onSnapshot | ⚠️ | بعض الصفحات تستخدمه، ليس الكل |
| تحديث Dashboard بدون Refresh | ⚠️ | يعتمد على الصفحة |

### 1.5 تحسين الأداء

| البند | الحالة | ملاحظة |
|-------|--------|---------|
| Pagination | ⚠️ | موجود في بعض القوائم |
| Lazy Loading | ⚠️ | غير موحد |
| Cache | ❌ | لا يوجد caching layer |

---

## 2. Payment System (نظام الدفع)

> بوابة الدفع المستخدمة: **MyFatoorah** (KNET + بطاقات ائتمان)

### 2.1 تدفق الدفع

| البند | الحالة | ملاحظة |
|-------|--------|---------|
| إنشاء Order بحالة `pending` | ⚠️ | `checkout/index.jsx` — يحتاج مراجعة |
| توجيه المستخدم لـ Payment Gateway | ✅ | [PaymentService.js](file:///c:/Users/PC/Documents/app/first-app/src/services/PaymentService.js) — [initiatePayment()](file:///c:/Users/PC/Documents/app/first-app/src/services/PaymentService.js#16-68) |
| Callback URL للنجاح | ✅ | `kataraa://checkout/success` |
| Error URL للفشل | ✅ | `kataraa://checkout/payment?error=true` |
| تحديث حالة الطلب بعد الدفع | ⚠️ | يعتمد على Frontend فقط حالياً |

### 2.2 Webhook Integration

| البند | الحالة | ملاحظة |
|-------|--------|---------|
| Webhook Endpoint في Backend | ❌ | **غير موجود** — هذا أهم نقصان |
| Signature Verification | ❌ | غير موجود |
| تحديث Order في DB من Webhook | ❌ | غير موجود |

> **🔴 خطر:** حالياً الدفع يُعتمد عليه من Frontend فقط. يجب إنشاء Backend (Firebase Cloud Functions) يستقبل Webhook من MyFatoorah.

### 2.3 التحقق من الدفع

| البند | الحالة | ملاحظة |
|-------|--------|---------|
| [getPaymentStatus()](file:///c:/Users/PC/Documents/app/first-app/src/services/PaymentService.js#69-96) | ✅ | موجود في [PaymentService.js](file:///c:/Users/PC/Documents/app/first-app/src/services/PaymentService.js) |
| التحقق يتم من Backend | ❌ | يتم من Frontend فقط |
| منع الطلبات الوهمية | ❌ | غير محمي |

---

## 3. Security (الأمان)

### 3.1 حماية Firebase

| البند | الحالة | ملاحظة |
|-------|--------|---------|
| Firestore Security Rules | ✅ | شاملة ومحكمة في [firestore.rules](file:///c:/Users/PC/Documents/app/first-app/firestore.rules) |
| Default Deny لكل collections | ✅ | `match /{document=**} { allow read, write: if false; }` |
| منع القراءة/الكتابة العامة | ✅ | مطبق |

### 3.2 حماية البيانات الحساسة

| البند | الحالة | ملاحظة |
|-------|--------|---------|
| API Keys في Environment Variables | ✅ | `.env` — `EXPO_PUBLIC_MYFATOORAH_API_KEY` |
| عدم تخزين مفاتيح في Frontend code | ⚠️ | مفتاح MyFatoorah في `.env` لكنه يُرسل من app |

> **⚠️ تحذير:** حالياً [PaymentService.js](file:///c:/Users/PC/Documents/app/first-app/src/services/PaymentService.js) يرسل API Key مباشرة من التطبيق. يجب أن يمر عبر Backend.

### 3.3 Validation

| البند | الحالة | ملاحظة |
|-------|--------|---------|
| Validation في Firestore Rules | ✅ | `hasRequiredFields()` مطبق |
| Validation في Frontend | ⚠️ | [cardValidation.js](file:///c:/Users/PC/Documents/app/first-app/src/services/cardValidation.js) موجود |
| Validation في Backend (Cloud Functions) | ❌ | لا يوجد Backend مستقل |

### 3.4 Rate Limiting

| البند | الحالة | ملاحظة |
|-------|--------|---------|
| Rate Limiting على API | ❌ | غير موجود |
| حماية من DDoS / Spam | ❌ | غير موجود |

> Firebase نفسه يوفر حماية أساسية، لكن تحتاج App Check لحماية أقوى.

### 3.5 Firebase App Check

| البند | الحالة | ملاحظة |
|-------|--------|---------|
| App Check مفعل | ❌ | غير موجود — يمنع استخدام Firebase خارج التطبيق |

---

## 4. تحسينات Pro Level

| البند | الحالة | ملاحظة |
|-------|--------|---------|
| Push Notifications | ✅ | [adminNotificationService.js](file:///c:/Users/PC/Documents/app/first-app/src/services/adminNotificationService.js) موجود |
| Crash Reporting | ❌ | لا يوجد (Firebase Crashlytics) |
| Analytics (Firebase) | ⚠️ | جزئياً — analytics محلية |
| Monitoring / Alerts | ⚠️ | [adminAlertService.js](file:///c:/Users/PC/Documents/app/first-app/src/services/adminAlertService.js) موجود |

---

## 5. ✅ Checklist الإطلاق — ملخص

### 🔴 عاجل جداً (قبل أي إطلاق)

- [ ] **Webhook Backend** — Cloud Function تستقبل نتيجة الدفع من MyFatoorah
- [ ] **نقل API Key** لـ MyFatoorah إلى Backend (ليس من التطبيق مباشرة)
- [ ] **Activity Logs** — تسجيل عمليات Admin في `adminLogs`

### 🟡 مهم (للإطلاق الاحترافي)

- [ ] **Firebase App Check** — لمنع البوتات
- [ ] **Staff UI Permissions** — تمييز بين manager/support في الواجهة
- [ ] **Real-time** موحد on كل صفحات Dashboard
- [ ] **Crash Reporting** — Firebase Crashlytics

### 🟢 تحسينات لاحقة

- [ ] **Caching Layer** للبيانات
- [ ] **Rate Limiting** (عبر Cloud Functions)
- [ ] **Pagination** موحد في كل القوائم
- [ ] **Analytics** Firebase مدمج

---

## 6. أولوية التنفيذ

```
المرحلة 1 (أسبوع): Webhook + API Key في Backend
      ↓
المرحلة 2 (أسبوع): Activity Logs + App Check
      ↓
المرحلة 3 (قبل الإطلاق): Staff UI + Real-time موحد
      ↓
الإطلاق على Google Play ✨
```

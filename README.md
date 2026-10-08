# Factory Logistics Management System

نظام إدارة الحركة اللوجستية للمصانع هو تطبيق ويب لمتابعة الشحنات، المخزون، الطلبات، المصانع، والمستودعات من خلال واجهة واحدة.

## المميزات

- لوحة تحكم إحصائية لأداء العمليات اللوجستية
- إدارة المصانع والمستودعات
- تتبع الشحنات والنقل
- إدارة الطلبات والشراء
- متابعة المخزون ومؤشرات التنبيهات
- واجهة عربية سهلة الاستخدام
- قابل للتشغيل محليًا بدون أي تبعيات خارجية

## التقنيات

- Node.js
- JavaScript نصي
- HTML/CSS
- JSON كقاعدة بيانات متوسطة للمشروع التجريبي

## التشغيل

1. تأكد من تثبيت Node.js على جهازك.
2. افتح المجلد في الطرفية.
3. شغل الأمر:

```bash
npm start
```

4. افتح الرابط التالي في المتصفح:

```text
http://localhost:3000
```

## هيكل المشروع

```text
factory-logistics-management-system/
├── public/
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── data/
│   └── db.json
├── package.json
├── README.md
├── server.js
└── .gitignore
```

## الملاحظات

هذا المشروع هو نسخة MVP عملية وقابلة للتطوير، مناسبة لعرض مفهوم النظام، ويمكن توسيعه لاحقًا ليشمل:

- تسجيل الدخول والصلاحيات
- قاعدة بيانات حقيقية (PostgreSQL/MySQL)
- API REST كامل
- تقارير PDF/Excel
- إشعارات SMS/Email
- تتبع GPS
- لوحة تحكم متقدمة

## توصيل للمستخدم

يمكنك توسيع هذا النظام لاحقًا إلى تطبيق كامل باستخدام:

- Frontend: React / Next.js
- Backend: Express / NestJS
- Database: PostgreSQL
- Auth: JWT / OAuth
- Deployment: Docker / Railway / Render


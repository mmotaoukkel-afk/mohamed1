const fs = require('fs');
const path = require('path');

const arPath = path.join(__dirname, 'src', 'i18n', 'locales', 'ar.json');
const enPath = path.join(__dirname, 'src', 'i18n', 'locales', 'en.json');

const arJson = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const translationsToAdd = {
    // Date ranges
    "اليوم": { ar: "اليوم", en: "Today" },
    "أمس": { ar: "أمس", en: "Yesterday" },
    "7_أيام": { ar: "7 أيام", en: "7 Days" },
    "30_يوم": { ar: "30 يوم", en: "30 Days" },
    "هذا_الشهر": { ar: "هذا الشهر", en: "This Month" },
    "الشهر_الماضي": { ar: "الشهر الماضي", en: "Last Month" },
    "هذه_السنة": { ar: "هذه السنة", en: "This Year" },
    "مخصص": { ar: "مخصص", en: "Custom" },

    // Funnel stages
    "الزوار": { ar: "الزوار", en: "Visitors" },
    "شاهدوا_المنتجات": { ar: "شاهدوا المنتجات", en: "Viewed Products" },
    "أضافوا_للسلة": { ar: "أضافوا للسلة", en: "Added to Cart" },
    "أكملوا_الشراء": { ar: "أكملوا الشراء", en: "Completed Purchase" },

    // Categories
    "إلكترونيات": { ar: "إلكترونيات", en: "Electronics" },
    "ملابس": { ar: "ملابس", en: "Clothing" },
    "مستحضرات تجميل": { ar: "مستحضرات تجميل", en: "Cosmetics" },
    "أغذية": { ar: "أغذية", en: "Food" },
    "إكسسوارات": { ar: "إكسسوارات", en: "Accessories" },
    "منزل": { ar: "منزل", en: "Home" },
    "أخرى": { ar: "أخرى", en: "Other" },

    // KPIs
    "conversion": { ar: "التحويل", en: "Conversion" },

    // Fixing previously missing
    "products": { ar: "المنتجات", en: "Products" },
    "save": { ar: "حفظ", en: "Save" },
    "window": { ar: "نافذة", en: "Window" }
};

for (const [key, trans] of Object.entries(translationsToAdd)) {
    arJson[key] = trans.ar;
    enJson[key] = trans.en;
}

fs.writeFileSync(arPath, JSON.stringify(arJson, null, 4));
fs.writeFileSync(enPath, JSON.stringify(enJson, null, 4));

console.log('Fixed underscored keys successfully.');

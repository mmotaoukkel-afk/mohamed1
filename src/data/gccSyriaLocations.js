/**
 * Detailed Locations Data for GCC Countries and Syria
 * Structure: 
 * export const countryLocations = {
 *   countryId: {
 *     governorates: [{ id, name, nameEn }],
 *     cities: { governorateId: ['City 1', 'City 2'] }
 *   }
 * }
 */

export const countryLocations = {
    kuwait: {
        governorates: [
            { id: 'AL Ahmadi', name: 'الأحمدي', nameEn: 'Al Ahmadi' },
            { id: 'AL Asimah', name: 'العاصمة', nameEn: 'Al Asimah' },
            { id: 'AL Farwaniyah', name: 'الفروانية', nameEn: 'Al Farwaniyah' },
            { id: 'AL Jahra', name: 'الجهراء', nameEn: 'Al Jahra' },
            { id: 'Hawalli', name: 'حولي', nameEn: 'Hawalli' },
            { id: 'Mubarak Al-Kabeer', name: 'مبارك الكبير', nameEn: 'Mubarak Al-Kabeer' },
        ],
        cities: {
            'AL Ahmadi': ['ميناء عبد الله', 'أبو حليفة', 'أحمدي', 'صباح الأحمد السكنية', 'صباح الأحمد البحرية', 'مدينة لؤلؤة الخيران', 'الزور', 'علي صباح السالم', 'عقيلة', 'بنيدر', 'ضاهر', 'الفحيحيل', 'الفنطاس', 'هدية', 'جابر العلي', 'الخيران', 'المهبولة', 'المنقف', 'النويصيب', 'الرقة', 'صباح الأحمد', 'الصباحية', 'وفرة'],
            'AL Asimah': ['عبد الله سالم', 'العديلية', 'بنيد القار', 'الدعية', 'الدسمة', 'دسمان', 'الدوحة', 'الفيحاء', 'غرناطة', 'جابر الأحمد', 'كيفان', 'الخالدية', 'مدينة الكويت', 'المنصورية', 'المرقاب', 'النهضة', 'النزهة', 'القادسية', 'قبلة', 'قرطبة', 'الروضة', 'الصالحية', 'الشامية', 'الشرق', 'الشويخ', 'الصليبخات', 'السرة', 'اليرموك'],
            'AL Farwaniyah': ['العباسية', 'عبد الله المبارك الصباح', 'أبرق خيطان', 'المطار', 'الحساوي', 'الرابية', 'الشدادية', 'الأندلس', 'العارضية', 'الضجيج', 'الفروانية', 'الفردوس', 'اشبيلية', 'جليب الشيوخ', 'خيطان', 'العمرية', 'الراي', 'صباح الناصر'],
            'AL Jahra': ['العبدلي', 'الجهراء', 'المطلاع', 'القيصرية', 'السالمي', 'أمغرة', 'العيون', 'كبد', 'كاظمة', 'نعيم', 'نسيم', 'القيروان', 'قصر', 'الروضتين', 'مدينة سعد عبد الله', 'الصابرية', 'الصبية', 'الصليبية', 'تيماء', 'الواحة'],
            'Hawalli': ['البدع', 'السلام', 'الشهداء', 'البيان', 'حطين', 'حولي', 'الجابرية', 'مشرف', 'الرميثية', 'السالمية', 'سلوى', 'الشعب', 'الصديق', 'الزهراء'],
            'Mubarak Al-Kabeer': ['أبو فطيرة', 'أبو الحصانية', 'العدان', 'الفنيطيس', 'المسايل', 'المسيلة', 'مبارك الكبير', 'القرين', 'القصور', 'صباح السالم', 'صبحان'],
        }
    },
    saudi: {
        governorates: [
            { id: 'riyadh', name: 'الرياض', nameEn: 'Riyadh' },
            { id: 'makkah', name: 'مكة المكرمة', nameEn: 'Makkah' },
            { id: 'madinah', name: 'المدينة المنورة', nameEn: 'Madinah' },
            { id: 'eastern', name: 'المنطقة الشرقية', nameEn: 'Eastern Province' },
            { id: 'qassim', name: 'القصيم', nameEn: 'Al-Qassim' },
            { id: 'asir', name: 'عسير', nameEn: 'Asir' },
            { id: 'tabuk', name: 'تبوك', nameEn: 'Tabuk' },
            { id: 'hail', name: 'حائل', nameEn: 'Ha\'il' },
            { id: 'northern', name: 'الحدود الشمالية', nameEn: 'Northern Borders' },
            { id: 'jazan', name: 'جازان', nameEn: 'Jazan' },
            { id: 'najran', name: 'نجران', nameEn: 'Najran' },
            { id: 'al_bahah', name: 'الباحة', nameEn: 'Al-Bahah' },
            { id: 'al_jawf', name: 'الجوف', nameEn: 'Al-Jawf' },
        ],
        cities: {
            riyadh: ['الرياض', 'الخرج', 'المجمعة', 'الدوادمي', 'الدرعية', 'القويعية', 'وادي الدواسر', 'عفيف', 'الزلفي', 'شقراء'],
            makkah: ['مكة المكرمة', 'جدة', 'الطائف', 'القنفذة', 'الليث', 'رابغ', 'خليص', 'الجموم', 'رنية', 'تربة'],
            madinah: ['المدينة المنورة', 'ينبع', 'العلا', 'بدر', 'خيبر', 'الحناكية', 'مهد الذهب', 'وادي الفرع'],
            eastern: ['الدمام', 'الخبر', 'الظهران', 'الأحساء', 'حفر الباطن', 'الجبيل', 'القطيف', 'الخفجي', 'النعيرية', 'بقيق'],
            qassim: ['بريدة', 'عنيزة', 'الرس', 'المذنب', 'البكيرية', 'البدائع', 'رياض الخبراء', 'الأسياح'],
            asir: ['أبها', 'خميس مشيط', 'بيشة', 'النماص', 'محايل عسير', 'ظهران الجنوب', 'تثليث', 'سراة عبيدة'],
            tabuk: ['تبوك', 'تيماء', 'أملج', 'الوجه', 'ضبا', 'حقل', 'البدع'],
            hail: ['حائل', 'بقعاء', 'الغزالة', 'الشنان', 'الحائط', 'السليمي', 'الشملي'],
            northern: ['عرعر', 'رفحاء', 'طريف', 'العويقيلة'],
            jazan: ['جازان', 'صبيا', 'صامطة', 'أبو عريش', 'بيش', 'الدرب', 'احد المسارحة', 'العيدابي'],
            najran: ['نجران', 'شرورة', 'حبونا', 'بدر الجنوب', 'يدمة', 'ثار'],
            al_bahah: ['الباحة', 'بلجرشي', 'المندق', 'المخواه', 'قلوة', 'العقيق', 'القرى'],
            al_jawf: ['سكاكا', 'القريات', 'دومة الجندل', 'طبرجل'],
        }
    },
    uae: {
        governorates: [
            { id: 'abu_dhabi', name: 'أبو ظبي', nameEn: 'Abu Dhabi' },
            { id: 'dubai', name: 'دبي', nameEn: 'Dubai' },
            { id: 'sharjah', name: 'الشارقة', nameEn: 'Sharjah' },
            { id: 'ajman', name: 'عجمان', nameEn: 'Ajman' },
            { id: 'umm_al_quwain', name: 'أم القيوين', nameEn: 'Umm Al Quwain' },
            { id: 'ras_al_khaimah', name: 'رأس الخيمة', nameEn: 'Ras Al Khaimah' },
            { id: 'fujairah', name: 'الفجيرة', nameEn: 'Fujairah' },
        ],
        cities: {
            abu_dhabi: ['مدينة أبو ظبي', 'العين', 'الظفرة', 'مصفح', 'بني ياس', 'الرويس', 'شهامة'],
            dubai: ['مدينة دبي', 'جبل علي', 'حتا', 'البرشاء', 'جميرا', 'ديرة', 'بر دبي', 'المرابع العربية'],
            sharjah: ['مدينة الشارقة', 'خورفكان', 'كلباء', 'الذيد', 'دبا الحصن', 'الحمرية'],
            ajman: ['مدينة عجمان', 'مصفوت', 'المنامة'],
            umm_al_quwain: ['مدينة أم القيوين', 'فلج المعلا'],
            ras_al_khaimah: ['مدينة رأس الخيمة', 'الرمس', 'شعم', 'الدقداقة'],
            fujairah: ['مدينة الفجيرة', 'دبا الفجيرة', 'قدفع', 'البدية'],
        }
    },
    qatar: {
        governorates: [
            { id: 'doha', name: 'الدوحة', nameEn: 'Doha' },
            { id: 'al_rayyan', name: 'الريان', nameEn: 'Al Rayyan' },
            { id: 'al_wakrah', name: 'الوكرة', nameEn: 'Al Wakrah' },
            { id: 'al_khor', name: 'الخور', nameEn: 'Al Khor' },
            { id: 'al_shamal', name: 'الشمال', nameEn: 'Al Shamal' },
            { id: 'al_daayen', name: 'الضعاين', nameEn: 'Al Daayen' },
            { id: 'umm_salal', name: 'أم صلال', nameEn: 'Umm Salal' },
            { id: 'al_shahaniya', name: 'الشيحانية', nameEn: 'Al Shahaniya' },
        ],
        cities: {
            doha: ['الدوحة', 'اللؤلؤة', 'القصر', 'الدفنة', 'مشيرب', 'السد'],
            al_rayyan: ['الريان', 'معيذر', 'الغرافة', 'عين خالد', 'الشيحانية'],
            al_wakrah: ['الوكرة', 'الوكير', 'مسيعيد'],
            al_khor: ['الخور', 'الذخيرة'],
            al_shamal: ['مدينة الشمال', 'الرويس'],
            al_daayen: ['الضعاين', 'لوسيل'],
            umm_salal: ['أم صلال محمد', 'أم صلال علي'],
            al_shahaniya: ['الشيحانية', 'دخان'],
        }
    },
    bahrain: {
        governorates: [
            { id: 'capital', name: 'المنامة', nameEn: 'Capital' },
            { id: 'muharraq', name: 'المحرق', nameEn: 'Muharraq' },
            { id: 'northern', name: 'الشمالية', nameEn: 'Northern' },
            { id: 'southern', name: 'الجنوبية', nameEn: 'Southern' },
        ],
        cities: {
            capital: ['المنامة', 'الجفير', 'الماحوز', 'العدلية', 'أم الحصم', 'النبيه صالح'],
            muharraq: ['المحرق', 'البسيتين', 'عراد', 'الحد', 'جلاي', 'ديار المحرق'],
            northern: ['مدينة حمد', 'البديع', 'الجنبية', 'سار', 'باربار', 'الدراز'],
            southern: ['مدينة عيسى', 'الرفاع', 'الزلاق', 'عوالي', 'جو', 'عسكر'],
        }
    },
    oman: {
        governorates: [
            { id: 'muscat', name: 'مسقط', nameEn: 'Muscat' },
            { id: 'dhofar', name: 'ظفار', nameEn: 'Dhofar' },
            { id: 'musandam', name: 'مسندم', nameEn: 'Musandam' },
            { id: 'al_buraimi', name: 'البريمي', nameEn: 'Al Buraimi' },
            { id: 'ad_dakhiliyah', name: 'الداخلية', nameEn: 'Ad Dakhiliyah' },
            { id: 'al_batinah_north', name: 'شمال الباطنة', nameEn: 'Al Batinah North' },
            { id: 'al_batinah_south', name: 'جنوب الباطنة', nameEn: 'Al Batinah South' },
            { id: 'ash_sharqiyah_north', name: 'شمال الشرقية', nameEn: 'Ash Sharqiyah North' },
            { id: 'ash_sharqiyah_south', name: 'جنوب الشرقية', nameEn: 'Ash Sharqiyah South' },
            { id: 'ad_dhahirah', name: 'الظاهرة', nameEn: 'Ad Dhahirah' },
            { id: 'al_wusta', name: 'الوسطى', nameEn: 'Al Wusta' },
        ],
        cities: {
            muscat: ['مسقط', 'السيب', 'بوشر', 'مطرح', 'العامرات', 'قريات'],
            dhofar: ['صلالة', 'ثمريت', 'طاقة', 'مرباط', 'رخيوت', 'ضلكوت', 'شلير'],
            musandam: ['خصب', 'بخاء', 'دباء', 'مدحاء'],
            al_buraimi: ['البريمي', 'محضة', 'السنينة'],
            ad_dakhiliyah: ['نزوى', 'بهلاء', 'سمائل', 'أدم', 'إزكي', 'منح', 'الحمراء'],
            al_batinah_north: ['صحار', 'شناص', 'لوى', 'صحم', 'الخابورة', 'السويق'],
            al_batinah_south: ['الرستاق', 'العوابي', 'نخل', 'وادي المعاول', 'بركاء', 'المصنعة'],
            ash_sharqiyah_north: ['إبراء', 'المضيبي', 'بدية', 'القابل', 'دماء والطائيين', 'وادي بني خالد'],
            ash_sharqiyah_south: ['صور', 'الكامل والوافي', 'جعل بوعلي', 'جعل بوحسن', 'مصيرة'],
            ad_dhahirah: ['عبري', 'ينقل', 'ضنك'],
            al_wusta: ['هيماء', 'محوت', 'الدقم', 'الجازر'],
        }
    },
    syria: {
        governorates: [
            { id: 'damascus', name: 'دمشق', nameEn: 'Damascus' },
            { id: 'rif_dimashq', name: 'ريف دمشق', nameEn: 'Rif Dimashq' },
            { id: 'aleppo', name: 'حلب', nameEn: 'Aleppo' },
            { id: 'homs', name: 'حمص', nameEn: 'Homs' },
            { id: 'hama', name: 'حماة', nameEn: 'Hama' },
            { id: 'latakia', name: 'اللاذقية', nameEn: 'Latakia' },
            { id: 'tartus', name: 'طرطوس', nameEn: 'Tartus' },
            { id: 'idlib', name: 'إدلب', nameEn: 'Idlib' },
            { id: 'hasakah', name: 'الحسكة', nameEn: 'Al-Hasakah' },
            { id: 'deir_ez_zor', name: 'دير الزور', nameEn: 'Deir ez-Zor' },
            { id: 'raqqa', name: 'الرقة', nameEn: 'Raqqa' },
            { id: 'daraa', name: 'درعا', nameEn: 'Daraa' },
            { id: 'as_suwayda', name: 'السويداء', nameEn: 'As-Suwayda' },
            { id: 'quneitra', name: 'القنيطرة', nameEn: 'Quneitra' },
        ],
        cities: {
            damascus: ['حي الشاغور', 'حي القنوات', 'حي الصالحية', 'حي المهاجرين', 'حي الميدان'],
            rif_dimashq: ['دوما', 'النبك', 'القطيفة', 'يبرود', 'الزبداني', 'التل', 'قدسيا'],
            aleppo: ['منبج', 'عفرين', 'عين العرب', 'الباب', 'السفيرة', 'جرابلس', 'اعزاز'],
            homs: ['تدمر', 'المخرم', 'القصير', 'الرستن', 'تلكلخ'],
            hama: ['السلمية', 'مصياف', 'محردة', 'الغاب'],
            latakia: ['جبلة', 'الحفة', 'القرداحة'],
            tartus: ['بانياس', 'الشيخ بدر', 'الدريكيش', 'صافيتا', 'مشتى الحلو'],
            idlib: ['أريحا', 'معرة النعمان', 'جسر الشغور', 'حارم'],
            hasakah: ['القامشلي', 'المالكية', 'رأس العين'],
            deir_ez_zor: ['الميادين', 'البوكمال'],
            raqqa: ['الثورة', 'تل أبيض'],
            daraa: ['نوى', 'الصنمين', 'إزرع'],
            as_suwayda: ['شهبا', 'صلخد'],
            quneitra: ['فيق', 'خان أرنبة'],
        }
    }
};

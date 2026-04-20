import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type AppLanguage = 'en' | 'ar';

const EN_AR_DICTIONARY: Record<string, string> = {
  "GAIN/LOSS TRACKER": "الربح/الخسارة",
  "WORKER TRANSFER": "التحويلات",
  "ASSIGNMENTS": "المصالح",
  "PERSONS": "الأفراد",
  "PERSON": "فرد",
  "JOBS": "الوضائف",
  "JOB": "وضيفة",
  "SETTINGS": "التعداد",
  "COMPANIS": "السرايا",
  "COMPANIES": "السرايا",
  "COMPANY": "سرية",
  "UNITES": "الوحدات",
  "UNITE": "وحدة",
  "GRADES": "الرتب",
  "GRADE": "رتبة",
  "YEARS": "الأعوام",
  "YEAR": "عام",
  "DASHBOARD": "لوحة التحكم",
  "SUPPORT": "الدعم",
  "LOGOUT": "تسجيل الخروج",
  "SEARCH...": "بحث...",
  "RESOURCES": "الموارد",
  "CURRENT DEPLOYMENT": "التوزيع الحالي",
  "INTELLIGENT FILTERS": "فلاتر ذكية",
  "RESET ALL": "إعادة التعيين",
  "ALL EMPLOYEES": "كل الأفراد",
  "ALL ROLES": "كل الوظائف",
  "ALL YEARS": "كل الأعوام",
  "ALL TYPES": "كل الأنواع",
  "NEW ASSIGNMENT": "مصلحة جديدة",
  "CREATE DEPLOYMENT": "إنشاء توزيع",
  "CURRENT ASSIGNMENTS": "المصالح الحالية",
  "EXPORT": "تصدير",
  "RESOURCE NAME": "اسم الفرد",
  "COMPANY / CLIENT": "السرية / الجهة",
  "JOB TITLE": "المسمى الوظيفي",
  "CONTRACT PERIOD": "فترة العقد",
  "STATUS": "الحالة",
  "NO ASSIGNMENTS FOUND.": "لا توجد مصالح.",
  "GRADE MISMATCH": "عدم تطابق الرتبة",
  "OK": "موافق",
  "SEARCH ENTRIES...": "ابحث في السجلات...",
  "DEPLOY A QUALIFIED PROFESSIONAL TO AN ACTIVE PROJECT.": "توزيع فرد مؤهل على مشروع نشط.",
  "JOB ROLE": "الدور الوظيفي",
  "CONTRACT TYPE": "نوع العقد",
  "ACTIF": "نشط",
  "CONTRACTUEL": "تعاقدي",
  "ACTIVE PROFESSIONAL MAPPINGS RECORDED": "تعيينات نشطة مسجلة",
  "ASSIGNED UNIT": "الوحدة المعيّنة",
  "EDIT ASSIGNMENT": "تعديل المصلحة",
  "SELECT EMPLOYEE...": "اختر فردا...",
  "NO JOBS FOR THIS COMPANY": "لا توجد وظائف لهذه السرية",
  "SELECT JOB...": "اختر وظيفة...",
  "SELECT A PERSON FIRST": "اختر فردا أولا",
  "FISCAL YEAR": "السنة المالية",
  "SELECT YEAR...": "اختر العام...",
  "PERMANENT": "دائم",
  "TEMPORARY": "مؤقت",
  "INTERN": "متربص",
  "CANCEL": "إلغاء",
  "UPDATE": "تحديث",
  "DEPLOY": "توزيع",
  "UTILISATION RATE": "نسبة الاستغلال",
  "UPCOMING RENEWALS": "تجديدات قادمة",
  "NEXT 30 DAYS WINDOW": "خلال 30 يوما القادمة",
  "OPEN REQUISITIONS": "طلبات مفتوحة",
  "ACTIVE": "نشط",
  "PENDING REVIEW": "بانتظار المراجعة",
  "ON HOLD": "معلّق",
  "GAINS & LOSSES DASHBOARD": "لوحة الربح والخسارة",
  "FILTER BY UNITE": "تصفية حسب الوحدة",
  "FILTER BY COMPANY": "تصفية حسب السرية",
  "ALL UNITES": "كل الوحدات",
  "ALL COMPANIES": "كل السرايا",
  "GAINS (NEW HIRES & TRANSFERS IN)": "الربح (توظيف جديد وتحويلات داخلية)",
  "LOSSES (DELETIONS & TRANSFERS OUT)": "الخسارة (حذف وتحويلات خارجية)",
  "TYPE": "النوع",
  "UNIT": "الوحدة",
  "DATE": "التاريخ",
  "TRANSFER IN": "تحويل داخل",
  "TRANSFER OUT": "تحويل خارج",
  "TRANSFER MOVEMENTS (FROM_UNITE TO TO_UNITE)": "حركات التحويل (من وحدة إلى وحدة)",
  "FROM UNITE": "من وحدة",
  "TO UNITE": "إلى وحدة",
  "FROM COMPANY": "من سرية",
  "TO COMPANY": "إلى سرية",
  "REASON": "السبب",
  "NO TRANSFERS FOUND FOR CURRENT FILTERS.": "لا توجد تحويلات حسب الفلاتر الحالية.",
  "TALENT MANAGEMENT": "إدارة الموارد البشرية",
  "REVIEW AND MANAGE INDIVIDUAL RECORDS FOR THE COMPANY.": "مراجعة وإدارة سجلات الأفراد في السرية.",
  "UPLOADING...": "جاري الرفع...",
  "BULK UPLOAD": "رفع جماعي",
  "ADD NEW PERSON": "إضافة فرد جديد",
  "EDIT RECORD": "تعديل السجل",
  "NEW RECORD": "سجل جديد",
  "FIRST NAME": "الاسم الأول",
  "LAST NAME": "اللقب",
  "MATRICULE": "رقم التعريف العسكري",
  "NATIONAL ID": "رقم التعريف الوطني",
  "TYPE OF CONTRACT": "نوع العقد",
  "NONE": "بدون",
  "SELECT UNITE...": "اختر الوحدة...",
  "SELECT...": "اختر...",
  "UPDATE IDENTITY": "تحديث البيانات",
  "CREATE IDENTITY": "إنشاء بيانات",
  "CANCEL EDIT": "إلغاء التعديل",
  "TOTAL EMPLOYEES ACTIVE": "إجمالي الأفراد النشطين",
  "PERSONNEL REGISTRY": "سجل الأفراد",
  "SEARCH EMPLOYEE RECORD...": "ابحث في سجل الأفراد...",
  "EMPLOYEE": "الفرد",
  "CONTRACT": "العقد",
  "UNIT / COMPANY": "الوحدة / السرية",
  "ACTIONS": "الإجراءات",
  "NO JOB ASSIGNED": "لا توجد وظيفة",
  "FULL-TIME": "دوام كامل",
  "FREELANCE": "متعاقد",
  "NO COMPANY": "لا توجد سرية",
  "NO EMPLOYEE RECORDS FOUND.": "لا توجد سجلات أفراد.",
  "QUARTERLY AUDIT REMINDER": "تذكير تدقيق ربع سنوي",
  "PLEASE ENSURE ALL CONTRACT ASSIGNMENTS ARE DIGITALLY REVIEWED BY FRIDAY.": "يرجى التأكد من مراجعة جميع تعيينات العقود رقميا قبل يوم الجمعة.",
  "REVIEW POLICY": "مراجعة السياسة",
  "PLEASE SELECT A WORKER AND A DESTINATION UNITE.": "يرجى اختيار عامل ووحدة وجهة.",
  "THE WORKER IS ALREADY IN THIS UNITE. PLEASE CHOOSE ANOTHER UNITE.": "العامل موجود بالفعل في هذه الوحدة. يرجى اختيار وحدة أخرى.",
  "AN ERROR OCCURRED DURING TRANSFER.": "حدث خطأ أثناء التحويل.",
  "TRANSFER COMPLETED SUCCESSFULLY.": "تم التحويل بنجاح.",
  "TRANSFER CENTER": "مركز التحويل",
  "TRANSFER AN EMPLOYEE BETWEEN UNITES AND OPTIONALLY ASSIGN A DESTINATION COMPANY AND JOB.": "انقل موظفا بين الوحدات مع إمكانية تعيين سرية ووظيفة للوجهة.",
  "UNITE TRANSFER": "تحويل وحدة",
  "1. SELECT WORKER": "1. اختر العامل",
  "CURRENT UNITE:": "الوحدة الحالية:",
  "UNKNOWN UNITE": "وحدة غير معروفة",
  "CURRENT JOB:": "الوظيفة الحالية:",
  "2. DESTINATION UNITE": "2. وحدة الوجهة",
  "3. COMPANY (OPTIONAL)": "3. السرية (اختياري)",
  "NO SELECTION": "بدون اختيار",
  "4. JOB (OPTIONAL)": "4. الوظيفة (اختياري)",
  "PENDING ASSIGNMENT": "بانتظار التعيين",
  "TRANSFER REASON (OPTIONAL)": "سبب التحويل (اختياري)",
  "CONFIRM TRANSFER": "تأكيد التحويل",
  "TRANSFER HISTORY": "سجل التحويلات",
  "TRANSFERS": "تحويلات",
  "SUGGESTED TRANSFERS": "التحويلات المقترحة",
  "SUGGESTIONS": "مقترحات",
  "REFRESH SUGGESTIONS": "تحديث المقترحات",
  "TRANSFER TYPE": "نوع التحويل",
  "FROM (UNITE/COMPANY/JOB)": "من (الوحدة/السرية/الوظيفة)",
  "TO (UNITE/COMPANY/JOB)": "إلى (الوحدة/السرية/الوظيفة)",
  "VALIDATE TRANSFER": "اعتماد التحويل",
  "VALIDATING...": "جاري الاعتماد...",
  "NO SUGGESTIONS AVAILABLE FOR THE SELECTED YEAR.": "لا توجد تحويلات مقترحة للعام المحدد.",
  "COULD NOT LOAD SUGGESTED TRANSFERS.": "تعذر تحميل التحويلات المقترحة.",
  "DO YOU WANT TO VALIDATE THIS SUGGESTED TRANSFER?": "هل تريد اعتماد هذا التحويل المقترح؟",
  "INTERNAL": "داخلي",
  "EXTERNAL": "خارجي",
  "FROM": "من",
  "TO": "إلى",
  "NO TRANSFER RECORDS FOUND.": "لا توجد سجلات تحويل.",
  "MISSING PERSON": "فرد غير موجود",
  "MISSING JOB": "وظيفة غير موجودة",
  "CHECK THE YEAR ASSIGNMENT": "تحقق من سنة التعيين",
  "TERMS": "شروط",
  "NEW COMPANY": "سرية جديدة",
  "ADD A NEW CORPORATE ENTITY TO THE SYSTEM.": "أضف كيانا جديدا للنظام.",
  "ADD COMPANY": "إضافة سرية",
  "SEARCH COMPANIES": "بحث السرايا",
  "REGISTERED COMPANIES": "السرايا المسجلة",
  "TOTAL COMPANIES": "إجمالي السرايا",
  "SERVICES COUNT": "عدد الخدمات",
  "NO JOBS ASSIGNED": "لا توجد وظائف",
  "EDIT COMPANY": "تعديل السرية",
  "COMPANY NAME": "اسم السرية",
  "COMPANY CODE": "رمز السرية",
  "SAVE": "حفظ",
  "NEW UNITE": "وحدة جديدة",
  "CREATE A NEW ORGANIZATIONAL STRUCTURE UNIT.": "إنشاء وحدة هيكل تنظيمي جديدة.",
  "ADD UNITE": "إضافة وحدة",
  "REGISTERED UNITES": "الوحدات المسجلة",
  "EDIT UNITE": "تعديل الوحدة",
  "CREATE UNITE": "إنشاء وحدة",
  "UNITE NAME": "اسم الوحدة",
  "UNITE CODE": "رمز الوحدة",
  "NEW GRADE": "رتبة جديدة",
  "DEFINE A NEW EMPLOYEE SENIORITY GRADE.": "تعريف رتبة أقدمية جديدة.",
  "ADD GRADE": "إضافة رتبة",
  "GRADES DICTIONARY": "قاموس الرتب",
  "EDIT GRADE": "تعديل الرتبة",
  "CREATE GRADE": "إنشاء رتبة",
  "GRADE CODE": "رمز الرتبة",
  "NEW FISCAL YEAR": "سنة مالية جديدة",
  "INITIALIZE A NEW FINANCIAL YEAR AND TOTAL QUOTAS.": "تهيئة سنة مالية جديدة وإجمالي الحصص.",
  "ADD YEAR": "إضافة عام",
  "FISCAL YEAR FILTERS": "فلاتر السنة المالية",
  "SEARCH YEARS": "بحث الأعوام",
  "YEAR REGISTRIES": "سجلات الأعوام",
  "TOTAL YEARS": "إجمالي الأعوام",
  "CLOSED": "مغلق",
  "EDIT YEAR": "تعديل العام",
  "IS CLOSED?": "مغلق؟",
  "ASSIGN QUOTA": "تعيين حصة",
  "ALLOCATE HIRING QUOTAS TO SPECIFIC UNITES.": "توزيع حصص التوظيف على وحدات محددة.",
  "ADD QUOTA": "إضافة حصة",
  "ALLOCATED QUOTAS": "الحصص الموزعة",
  "BUSINESS UNITE": "وحدة الأعمال",
  "QUOTA LIMIT": "حد الحصة",
  "EDIT QUOTA": "تعديل الحصة",
  "QUOTA COUNT": "عدد الحصة",
  "QUOTA EXCEEDED": "تم تجاوز الحصة",
  "ORGANIZATION SETUP": "إعداد المؤسسة",
  "COMPANIES, UNITES, GRADES, YEARS & QUOTAS": "السرايا والوحدات والرتب والأعوام والحصص",
  "STATISTICS DASHBOARD": "لوحة الإحصائيات",
  "ALL": "الكل",
  "CURRENT WORKERS": "محقق",
  "MAX WORKERS": "نضري",
  "JOB CAPACITY VS. ACTUAL": "وضيفة نضري / محقق",
  "COMPANY CAPACITY VS. ACTUAL": "سرية نضري/ محقق",
  "MISSING": "النقص",
  "PERCENTAGE": "النسبة",
  "UNITE DETAILS": "تفاصيل الوحدة",
  "LOADING...": "جاري التحميل...",
  "UNITES WITH STATUS:": "الوحدات حسب الحالة:",
  "NO UNITES FOUND FOR THIS STATUS.": "لا توجد وحدات بهذه الحالة.",
  "DEFICIT": "عجز",
  "BALANCED": "متوازن",
  "SURPLUS": "فائض",
  "DELETE THIS COMPANY?": "حذف هذه السرية؟",
  "DELETE THIS UNITE?": "حذف هذه الوحدة؟",
  "DELETE THIS GRADE?": "حذف هذه الرتبة؟",
  "DELETE THIS FISCAL YEAR?": "حذف هذه السنة المالية؟",
  "DELETE THIS QUOTA?": "حذف هذه الحصة؟",
  "FISCAL YEARS": "الأعوام المالية",
  "YEARS CONFIGURATION": "إعداد الأعوام",
  "COMPANIES DIRECTORY": "دليل السرايا",
  "JOB INVENTORY": "سجل الوظائف",
  "MANAGE ORGANIZATIONAL ROLES, RECRUITMENT CAPS, AND OPERATIONAL GRADING BENCHMARKS.": "إدارة الوظائف وحدود التوظيف ومعايير الرتب التشغيلية.",
  "BULK UPLOAD (EXCEL)": "رفع جماعي (إكسل)",
  "CREATE NEW JOB": "إنشاء وظيفة جديدة",
  "EDIT ROLE": "تعديل الدور",
  "QUICK ADD ROLE": "إضافة دور سريعة",
  "UPDATE POSITION DETAILS.": "تحديث تفاصيل المنصب.",
  "REGISTER A NEW POSITION IMMEDIATELY.": "تسجيل منصب جديد مباشرة.",
  "JOB NAME": "اسم الوظيفة",
  "SELECT COMPANY...": "اختر السرية...",
  "ACCEPTED GRADES (HOLD CTRL/CMD TO SELECT MULTIPLE)": "الرتب المقبولة (اضغط Ctrl/Cmd للاختيار المتعدد)",
  "UPDATE REGISTRY": "تحديث السجل",
  "ADD TO REGISTRY": "إضافة إلى السجل",
  "TOTAL ROLES": "إجمالي الأدوار",
  "CAPACITY": "السعة",
  "SEARCH POSITIONS...": "ابحث عن المناصب...",
  "JOB TITLE & CODE": "عنوان الوظيفة ورمزها",
  "REQUIRED GRADES": "الرتب المطلوبة",
  "UNKNOWN": "غير معروف",
  "NO ROLES FOUND MATCHING YOUR SEARCH.": "لا توجد أدوار مطابقة للبحث.",
  "GROWTH TREND": "اتجاه النمو",
  "POSITIONS": "مناصب",
  "HIRING VELOCITY": "وتيرة التوظيف",
  "HIGH DEMAND": "طلب مرتفع",
  "SYSTEM STATUS": "حالة النظام",
  "REGISTRY SYNCED": "تمت مزامنة السجل",
  "BULK UPLOAD SUCCESSFUL!": "تم الرفع الجماعي بنجاح!",
  "BULK UPLOAD FAILED:": "فشل الرفع الجماعي:",
  "UNKNOWN ERROR": "خطأ غير معروف",
  "DELETE THIS JOB?": "حذف هذه الوظيفة؟",
  "ERROR SAVING UNITE": "خطأ أثناء حفظ الوحدة",
  "ERROR SAVING GRADE": "خطأ أثناء حفظ الرتبة",
  "BUSINESS UNITES": "وحدات الأعمال",
  "UNITES DIRECTORY": "دليل الوحدات",
  "EMPLOYEE GRADES": "رتب الموظفين",
  "QUOTA MANAGEMENT": "إدارة الحصص",
  "USERS MANAGEMENT": "إدارة الحسابات",
  "CREATE ADMIN OR GUEST ACCOUNTS AND MANAGE EXISTING ACCOUNT PASSWORDS": "أنشئ حسابات مسؤول أو ضيف وأدر كلمات مرور الحسابات الحالية",
  "USERNAME": "اسم المستخدم",
  "PASSWORD": "كلمة المرور",
  "ROLE": "الدور",
  "GUEST": "ضيف",
  "ADMIN": "مسؤول",
  "CREATE USER": "إنشاء حساب",
  "MANAGE EXISTING ACCOUNTS": "إدارة الحسابات الحالية",
  "LOADING ACCOUNTS...": "جاري تحميل الحسابات...",
  "NO ACCOUNTS FOUND": "لا توجد حسابات",
  "UPDATE PASSWORD": "تحديث كلمة المرور",
  "DELETE": "حذف",
  "YOU": "أنت",
  "NEW PASSWORD": "كلمة مرور جديدة",
  "USER CREATED SUCCESSFULLY": "تم إنشاء الحساب بنجاح",
  "FAILED TO CREATE USER": "فشل إنشاء الحساب",
  "FAILED TO LOAD ACCOUNTS": "فشل تحميل الحسابات",
  "PASSWORD UPDATED SUCCESSFULLY": "تم تحديث كلمة المرور بنجاح",
  "PASSWORD UPDATED SUCCESSFULLY.": "تم تحديث كلمة المرور بنجاح.",
  "FAILED TO UPDATE PASSWORD": "فشل تحديث كلمة المرور",
  "DELETE ACCOUNT": "حذف الحساب",
  "ACCOUNT DELETED SUCCESSFULLY": "تم حذف الحساب بنجاح",
  "FAILED TO DELETE ACCOUNT": "فشل حذف الحساب",
  "PLEASE PROVIDE A NEW PASSWORD FIRST": "يرجى إدخال كلمة مرور جديدة أولا",
  "ACCESS DENIED": "تم رفض الوصول",
  "SECURE ACCESS": "وصول آمن",
  "WORKFORCE OPERATIONS": "عمليات الموارد البشرية",
  "CONTROLLED WITH CLARITY": "بإدارة واضحة",
  "SIGN IN WITH YOUR USERNAME AND PASSWORD TO ACCESS DASHBOARDS, STAFFING WORKFLOWS, AND ACCOUNT MANAGEMENT": "سجل الدخول باسم المستخدم وكلمة المرور للوصول إلى لوحات المتابعة وسير العمل وإدارة الحسابات",
  "SIGN IN": "تسجيل الدخول",
  "WELCOME BACK. ENTER YOUR ACCOUNT CREDENTIALS TO CONTINUE": "مرحبا بعودتك. أدخل بيانات حسابك للمتابعة",
  "UNABLE TO SIGN IN WITH THE PROVIDED CREDENTIALS": "تعذر تسجيل الدخول بالبيانات المدخلة",
  "LOGIN": "دخول",
  "FORGOT PASSWORD": "نسيت كلمة المرور",
  "ENTER YOUR USERNAME TO CONTINUE": "أدخل اسم المستخدم للمتابعة",
  "CHECK ACCOUNT": "فحص الحساب",
  "PLEASE ENTER A USERNAME": "يرجى إدخال اسم المستخدم",
  "THIS ACCOUNT IS ADMIN. YOU CAN SET A NEW PASSWORD": "هذا الحساب مسؤول. يمكنك تعيين كلمة مرور جديدة",
  "THIS ACCOUNT IS ADMIN. YOU CAN SET A NEW PASSWORD.": "هذا الحساب مسؤول. يمكنك تعيين كلمة مرور جديدة.",
  "THIS ACCOUNT IS GUEST. PLEASE CHECK WITH YOUR MANAGER": "هذا الحساب ضيف. يرجى التواصل مع المسؤول",
  "THIS ACCOUNT IS GUEST. PLEASE CHECK WITH YOUR MANAGER.": "هذا الحساب ضيف. يرجى التواصل مع المسؤول.",
  "USERNAME NOT FOUND": "اسم المستخدم غير موجود",
  "USERNAME NOT FOUND.": "اسم المستخدم غير موجود.",
  "FAILED TO RESET PASSWORD": "فشلت إعادة تعيين كلمة المرور",
  "RESET PASSWORD": "إعادة تعيين كلمة المرور",
  "PASSWORD CHANGED SUCCESSFULLY. YOU CAN LOGIN NOW": "تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن",
  "PASSWORD CHANGED SUCCESSFULLY. YOU CAN LOGIN NOW.": "تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.",
  "ACCESS IS ROLE-BASED. ADMIN AND GUEST ACCOUNTS HAVE DIFFERENT PERMISSIONS": "الوصول يعتمد على الدور. حسابات المسؤول والضيف لها صلاحيات مختلفة",
  "ONLY ADMIN ACCOUNTS CAN RESET PASSWORD HERE": "يمكن فقط لحسابات المسؤول إعادة تعيين كلمة المرور هنا",
  "ONLY ADMIN ACCOUNTS CAN RESET PASSWORD HERE.": "يمكن فقط لحسابات المسؤول إعادة تعيين كلمة المرور هنا.",
  "YOU CANNOT DELETE YOUR OWN ACCOUNT.": "لا يمكنك حذف حسابك الشخصي.",
  "YOU CANNOT DELETE THE LAST ADMIN ACCOUNT.": "لا يمكنك حذف آخر حساب مسؤول.",
};

const AR_FR_EN_DICTIONARY: Record<string, string> = {
  "الربح/الخسارة": "Gain/Loss Tracker",
  "التحويلات": "Worker Transfer",
  "المصالح": "Assignments",
  "الأفراد": "Persons",
  "فرد": "Person",
  "الوضائف": "Jobs",
  "وضيفة": "Job",
  "التعداد": "Settings",
  "السرايا": "Companies",
  "سرية": "Company",
  "الوحدات": "Unites",
  "وحدة": "Unite",
  "الرتب": "Grades",
  "رتبة": "Grade",
  "الأعوام": "Years",
  "عام": "Year",
  "لوحة التحكم": "Dashboard",
  "الدعم": "Support",
  "تسجيل الخروج": "Logout",
  "بحث...": "Search...",
  "الموارد": "Resources",
  "التوزيع الحالي": "Current Deployment",
  "فلاتر ذكية": "INTELLIGENT FILTERS",
  "إعادة التعيين": "RESET ALL",
  "كل الأفراد": "All Employees",
  "كل الوظائف": "All Roles",
  "كل الأعوام": "All Years",
  "كل الأنواع": "All Types",
  "مصلحة جديدة": "New Assignment",
  "إنشاء توزيع": "Create Deployment",
  "المصالح الحالية": "Current Assignments",
  "تصدير": "Export",
  "اسم الفرد": "Resource Name",
  "السرية / الجهة": "Company / Client",
  "المسمى الوظيفي": "Job Title",
  "فترة العقد": "Contract Period",
  "الحالة": "Status",
  "لا توجد مصالح.": "No assignments found.",
  "عدم تطابق الرتبة": "Grade Mismatch",
  "موافق": "OK",
  "ابحث في السجلات...": "Search entries...",
  "الدور الوظيفي": "Job Role",
  "نوع العقد": "Contract Type",
  "نشط": "Active",
  "تعاقدي": "Contractual",
  "بانتظار المراجعة": "Pending Review",
  "معلّق": "On Hold",
  "الوحدة": "Unit",
  "التاريخ": "Date",
  "السبب": "Reason",
  "من وحدة": "From Unite",
  "إلى وحدة": "To Unite",
  "من سرية": "From Company",
  "إلى سرية": "To Company",
  "إلغاء": "Cancel",
  "تحديث": "Update",
  "دائم": "Permanent",
  "مؤقت": "Temporary",
  "متربص": "Intern",
  "actif": "Active",
  "contractuel": "Contractual",
  "Veuillez sélectionner un travailleur et une unité de destination.": "Please select a worker and a destination unite.",
  "Le travailleur est deja dans cette unite. Choisissez une autre unite.": "The worker is already in this unite. Please choose another unite.",
  "Une erreur est survenue pendant le transfert.": "An error occurred during transfer.",
  "Transfert d'Unite": "Unite Transfer",
  "Selectionner l'employe": "Select Worker",
  "Unite actuelle:": "Current Unite:",
  "Unite inconnue": "Unknown Unite",
  "Poste actuel:": "Current Job:",
  "Unite de destination": "Destination Unite",
  "optionnel": "optional",
  "Aucune selection": "No selection",
  "En attente d'affectation": "Pending assignment",
  "Motif du transfert": "Transfer reason",
  "Valider le transfert": "Confirm Transfer",
  "Historique des transferts": "Transfer History",
  "transferts": "transfers",
  "Employe": "Employee",
  "De": "From",
  "Vers": "To",
  "Motif": "Reason",
  "Aucun transfert enregistre.": "No transfer records found.",
  "التحويلات المقترحة": "Suggested Transfers",
  "مقترحات": "Suggestions",
  "تحديث المقترحات": "Refresh suggestions",
  "نوع التحويل": "Transfer Type",
  "من (الوحدة/السرية/الوظيفة)": "From (Unite/Company/Job)",
  "إلى (الوحدة/السرية/الوظيفة)": "To (Unite/Company/Job)",
  "اعتماد التحويل": "Validate transfer",
  "جاري الاعتماد...": "Validating...",
  "لا توجد تحويلات مقترحة للعام المحدد.": "No suggestions available for the selected year.",
  "تعذر تحميل التحويلات المقترحة.": "Could not load suggested transfers.",
  "هل تريد اعتماد هذا التحويل المقترح؟": "Do you want to validate this suggested transfer?",
  "داخلي": "Internal",
  "خارجي": "External",
};

const LANGUAGE_STORAGE_KEY = 'bfops-language';

const normalizeKey = (text: string) => text.trim().replace(/\s+/g, ' ').toUpperCase();
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const sortedDictionaryEntries = Object.entries(EN_AR_DICTIONARY).sort(
  ([a], [b]) => b.length - a.length
);

const sortedReverseEntries = Object.entries(AR_FR_EN_DICTIONARY).sort(
  ([a], [b]) => b.length - a.length
);

export const translateEnToAr = (text: string): string => {
  if (!text) return text;

  const exact = EN_AR_DICTIONARY[normalizeKey(text)];
  if (exact) return exact;

  let translated = text;
  for (const [source, target] of sortedDictionaryEntries) {
    const pattern = new RegExp(escapeRegExp(source), 'gi');
    translated = translated.replace(pattern, target);
  }
  return translated;
};

export const translateToEnglish = (text: string): string => {
  if (!text) return text;

  const normalized = normalizeKey(text);
  const exactEnglishKey = Object.keys(EN_AR_DICTIONARY).find((key) => key === normalized);
  if (exactEnglishKey) return text;

  const direct = AR_FR_EN_DICTIONARY[text.trim()];
  if (direct) return direct;

  let translated = text;
  for (const [source, target] of sortedReverseEntries) {
    const pattern = new RegExp(escapeRegExp(source), 'g');
    translated = translated.replace(pattern, target);
  }
  return translated;
};

type I18nContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  toggleLanguage: () => void;
  t: (text: string) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    if (typeof window === 'undefined') return 'en';
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return stored === 'ar' ? 'ar' : 'en';
  });

  const setLanguage = useCallback((nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === 'en' ? 'ar' : 'en'));
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }
  }, [language]);

  const t = useCallback(
    (text: string) => (language === 'ar' ? translateEnToAr(text) : translateToEnglish(text)),
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage, t }),
    [language, setLanguage, toggleLanguage, t]
  );

  return createElement(I18nContext.Provider, { value }, children);
}

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider');
  }
  return context;
};

export const enArDictionary = EN_AR_DICTIONARY;

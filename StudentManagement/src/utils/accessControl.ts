import { supabase } from './supabase';

// واجهة النتيجة المتوقعة من السيرفر
export interface AccessStatus {
  access: 'granted' | 'denied';
  type?: 'paid' | 'trial';
  plan?: string;
  days_remaining?: number;
  hours_remaining?: number;
  reason?: string;
}

// دالة مساعدة بسيطة للحصول على البصمة المخزنة أو توليد واحدة مؤقتة للتحقق
const getSimpleFingerprint = (): string => {
  const stored = localStorage.getItem('device_fp_secure');
  if (stored) return stored;
  // في حال لم تكن البصمة موجودة، نستخدم قيمة مؤقتة (سيقوم trialManager بإنشائها لاحقاً بشكل صحيح)
  return 'pending_fingerprint';
};

export const accessControl = {
  /**
   * التحقق من صلاحية الوصول عبر السيرفر حصراً (Zero Trust)
   * نسخة خفيفة لمنع التداخل
   */
  async checkAccess(): Promise<AccessStatus> {
    try {
      // 1. الحصول على المعرفات مباشرة من التخزين لتجنب التداخل
      let deviceFingerprint = getSimpleFingerprint();
      const institutionId = localStorage.getItem('bga_institution_id');

      // إذا لم توجد بصمة، لا داعي للاتصال بالسيرفر (لأنه لن يجد شيئاً)
      if (deviceFingerprint === 'pending_fingerprint') {
         // لكن، قد يكون هناك institution_id، لذا سنكمل التحقق
         // إلا إذا كان كلاهما غير موجود
         if (!institutionId) {
             return { access: 'denied', reason: 'no_license' };
         }
      }

      // 2. استدعاء الدالة الآمنة في Supabase
      const { data, error } = await supabase.rpc('check_access_status', {
        p_device_fingerprint: deviceFingerprint,
        p_institution_id: institutionId
      });

      if (error) {
        console.error('Supabase RPC Error:', error);
        throw error;
      }

      // 3. إرجاع النتيجة
      return data as AccessStatus;

    } catch (error) {
      console.error('Check Access Failed:', error);
      // إرجاع حالة "مرفوض" مع سبب خطأ الاتصال
      return { access: 'denied', reason: 'connection_error' };
    }
  }
};

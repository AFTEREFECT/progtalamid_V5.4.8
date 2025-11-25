import { useEffect, useState } from 'react';
import { subscriptionManager, Subscription } from '../utils/subscriptionManager';

/**
 * Hook مخصص للوصول إلى معلومات الاشتراك في أي مكون
 * يوفر الخطة الحالية، الحالة، والميزات المتاحة
 */
export const useSubscription = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [planName, setPlanName] = useState<string>('None');

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const sub = await subscriptionManager.getCurrentSubscription();
      setSubscription(sub);
      setIsActive(subscriptionManager.isSubscriptionActive());
      setPlanName(subscriptionManager.getPlanName());
    } catch (error) {
      console.error('❌ خطأ في تحميل الاشتراك:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * التحقق من توفر ميزة معينة في الخطة الحالية
   * @param feature - اسم الميزة (مثل 'whatsapp_integration')
   * @returns true إذا كانت الميزة متاحة
   */
  const hasFeature = (feature: string): boolean => {
    return subscriptionManager.hasFeature(feature);
  };

  /**
   * الحصول على عدد الأيام المتبقية في الاشتراك
   * @returns عدد الأيام أو null إذا كان الاشتراك غير محدود
   */
  const getDaysRemaining = (): number | null => {
    return subscriptionManager.getDaysRemaining();
  };

  /**
   * إعادة تحميل بيانات الاشتراك من السيرفر
   * مفيد بعد التفعيل أو الترقية
   */
  const refresh = async () => {
    await loadSubscription();
  };

  return {
    subscription,        // كائن الاشتراك الكامل
    loading,            // حالة التحميل
    isActive,           // هل الاشتراك نشط؟
    planName,           // اسم الخطة (Basic, Pro, Expert)
    hasFeature,         // دالة للتحقق من الميزات
    getDaysRemaining,   // الأيام المتبقية
    refresh             // إعادة التحميل
  };
};

import React, { useState, useEffect } from 'react';
import { Users, Smartphone, Search as SearchIcon, RefreshCw, Phone } from 'lucide-react';
import { dbManager } from '../utils/database';
import { Student } from '../types';

const GuardianPhoneManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ studentId: string; field: string } | null>(null);
  const [levels, setLevels] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // تحميل البيانات والمستويات والأقسام عند التحميل
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const studentsData = await dbManager.getStudents();
        const levelsData = await dbManager.getLevels();
        const sectionsData = await dbManager.getSections();

        setStudents(studentsData);
        setLevels(levelsData.map((l: any) => l.name));
        setSections(sectionsData.map((s: any) => s.name));
      } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // تصفية البيانات بحسب البحث والفلاتر
  useEffect(() => {
    let filtered = [...students];
    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.nationalId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (levelFilter) {
      filtered = filtered.filter((s) => s.level === levelFilter);
    }
    if (sectionFilter) {
      filtered = filtered.filter((s) => s.section === sectionFilter);
    }
    setFilteredStudents(filtered);
  }, [students, searchTerm, levelFilter, sectionFilter]);

  // حفظ التعديل السريع والانتقال للأسفل لو ضغط Enter
  const handleQuickUpdate = async (
    studentId: string,
    field: string,
    value: string,
    moveNext: boolean
  ) => {
    try {
      await dbManager.updateStudent(studentId, {
        [field]: value,
      });
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, [field]: value } : s))
      );
      setFilteredStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, [field]: value } : s))
      );

      if (moveNext) {
        const currentIndex = filteredStudents.findIndex((s) => s.id === studentId);
        if (currentIndex < filteredStudents.length - 1) {
          const nextStudent = filteredStudents[currentIndex + 1];
          setEditingCell({ studentId: nextStudent.id, field });
          setSelectedRowId(nextStudent.id);
        } else {
          setEditingCell(null);
        }
      } else {
        setEditingCell(null);
      }
    } catch (error) {
      console.error('فشل تحديث الرقم:', error);
      alert('حدث خطأ أثناء حفظ الرقم.');
    }
  };

  // تحديث نوع ولي الأمر (أب أو أم أو التلميذ أو وليه)
  const handleGuardianTypeChange = async (studentId: string, type: 'student' | 'father' | 'mother' | 'guardian_pref') => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    let guardian_phone = '';
    
    if (type === 'student') {
      guardian_phone = student.phone || '';
    } else if (type === 'father') {
      guardian_phone = student.father_phone || '';
    } else if (type === 'mother') {
      guardian_phone = student.mother_phone || '';
    } else if (type === 'guardian_pref') {
      // استعمال الرقم المفضل لولي الأمر (الذي تم اختياره من قبل)
      guardian_phone = student.guardian_phone || student.father_phone || '';
    }

    try {
      await dbManager.updateStudent(studentId, {
        contact_preference: type, // حفظ نوع الاتصال المختار
        guardian_phone: guardian_phone,
      });
      
      const updatedStudents = students.map(s =>
        s.id === studentId ? { ...s, contact_preference: type, guardian_phone } : s
      );
      setStudents(updatedStudents);
      setFilteredStudents(
        filteredStudents.map(s =>
          s.id === studentId ? { ...s, contact_preference: type, guardian_phone } : s
        )
      );
    } catch (error) {
      console.error('فشل تحديث نوع الاتصال:', error);
      alert('فشل تحديث نوع الاتصال');
    }
  };

  // تحديث دفعي لجميع التلاميذ
 const batchUpdateGuardianPhones = async () => {
  if (!window.confirm('هل تريد تحديث جميع أرقام الاتصال دفعة واحدة؟')) return;
  setIsLoading(true);

  const failedUpdates = []; // مصفوفة لتتبع التحديثات الفاشلة

  for (const student of students) {
    try {
      // نفس منطق الأولوية الخاص بك
      const hasFatherPhone = student.father_phone?.trim();
      const hasMotherPhone = student.mother_phone?.trim();

      let guardian_phone = '';
      let contact_preference = '';

      if (hasFatherPhone) {
        guardian_phone = student.father_phone;
        contact_preference = 'father';
      } else if (hasMotherPhone) {
        guardian_phone = student.mother_phone;
        contact_preference = 'mother';
      } else {
        // إذا لم يكن هناك هاتف للأب أو الأم، تجاهل هذا الطالب وانتقل إلى التالي
        continue; // This is the key: skip to the next iteration of the loop
      }

      // قم بالتحديث فقط إذا وجدنا رقم هاتف
      await dbManager.updateStudent(student.id, {
        guardian_phone,
        contact_preference,
      });

    } catch (error) {
      console.error(`فشل تحديث الطالب: ${student.firstName} ${student.lastName} (ID: ${student.id})`, error);
      failedUpdates.push(student); // أضف الطالب الفاشل إلى القائمة
    }
  }

  setIsLoading(false);

  // إبلاغ المستخدم بالنتيجة النهائية
  if (failedUpdates.length > 0) {
    alert(`اكتملت العملية، لكن فشل تحديث ${failedUpdates.length} طالب. يرجى مراجعة الـ console لمزيد من التفاصيل.`);
    console.log("الطلاب الذين فشل تحديثهم:", failedUpdates);
  } else {
    alert('تم تحديث جميع أرقام الاتصال بنجاح.');
  }

  // إعادة تحميل البيانات لإظهار التغييرات
  const studentsData = await dbManager.getStudents();
  setStudents(studentsData);
};


const batchUpdateStudentPhones = async () => {
  if (!window.confirm('هل تريد تحديث أرقام التلاميذ باستخدام رقم الأم أولاً ثم رقم الأب؟')) return;
  setIsLoading(true);
  try {
    for (const student of students) {
      const hasMotherPhone = Boolean(student.mother_phone && student.mother_phone.trim() !== '');
      const hasFatherPhone = Boolean(student.father_phone && student.father_phone.trim() !== '');

      let student_phone = '';

      if (hasMotherPhone) {
        student_phone = student.mother_phone;
      } else if (hasFatherPhone) {
        student_phone = student.father_phone;
      }

      await dbManager.updateStudent(student.id, {
        phone: student_phone,
      });
    }
    alert('تم تحديث أرقام التلاميذ بنجاح حسب منطق رقم الأم ثم الأب.');
    const studentsData = await dbManager.getStudents();
    setStudents(studentsData);
  } catch (error) {
    console.error('خطأ في التحديث الدفعي لأرقام التلاميذ:', error);
    alert('فشل التحديث الدفعي لأرقام التلاميذ.');
  } finally {
    setIsLoading(false);
  }
};






  return (
    <div className="p-6 bg-gray-50 min-h-screen">
     <div className="mb-6 flex items-center justify-between">
  <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
    <Smartphone className="w-8 h-8 text-blue-600" /> تدبير أرقام الاتصال
  </h1>
  <div className="flex gap-4">
    <button
      onClick={batchUpdateGuardianPhones}
      disabled={isLoading}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
    >
      تحديث تلقائي دفعة واحدة (ولي الأمر)
    </button>
    <button
      onClick={batchUpdateStudentPhones}
      disabled={isLoading}
      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
    >
      تحديث تلقائي (رقم التلميذ)
    </button>
  </div>
</div>


      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="ابحث بالاسم أو الرقم الوطني"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="border p-2 rounded"
        />
        <select
          value={levelFilter}
          onChange={e => setLevelFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">جميع المستويات</option>
          {levels.map(level => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
        <select
          value={sectionFilter}
          onChange={e => setSectionFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">جميع الأقسام</option>
          {sections.map(section => (
            <option key={section} value={section}>{section}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto bg-white shadow rounded">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">اسم التلميذ</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">القسم</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">الرقم الوطني</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">رقم التلميذ</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">هاتف الأب</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">هاتف الأم</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">نوع الاتصال</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">رقم الاتصال الفعلي</th>
            </tr>
          </thead>

          <tbody>
            {filteredStudents.map((student, idx) => (
              <tr
                key={student.id}
                className={selectedRowId === student.id ? 'bg-green-100 border-l-4 border-green-600' : 'hover:bg-gray-50'}
                onClick={() => setSelectedRowId(student.id)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  {student.firstName} {student.lastName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.section || '---'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{student.nationalId || '---'}</td>

                {/* رقم التلميذ - تعديل مباشر */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 cursor-pointer"
                    onClick={() => setEditingCell({ studentId: student.id, field: 'phone' })}
                >
                  {editingCell?.studentId === student.id && editingCell?.field === 'phone' ? (
                    <input
                      type="tel"
                      defaultValue={student.phone || ''}
                      autoFocus
                      onBlur={(e) => handleQuickUpdate(student.id, 'phone', e.target.value, false)}
                      onKeyDown={(e) => {
                        if(e.key === 'Enter') {
                          e.preventDefault();
                          handleQuickUpdate(student.id, 'phone', e.currentTarget.value, true);
                        }
                        if(e.key === 'Escape') {
                          setEditingCell(null);
                        }
                      }}
                      className="border border-green-600 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  ) : (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4 text-blue-500" />
                      {student.phone || '---'}
                    </div>
                  )}
                </td>

                {/* هاتف الأب - تعديل مباشر */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 cursor-pointer"
                    onClick={() => setEditingCell({ studentId: student.id, field: 'father_phone' })}
                >
                  {editingCell?.studentId === student.id && editingCell?.field === 'father_phone' ? (
                    <input
                      type="tel"
                      defaultValue={student.father_phone || ''}
                      autoFocus
                      onBlur={(e) => handleQuickUpdate(student.id, 'father_phone', e.target.value, false)}
                      onKeyDown={(e) => {
                        if(e.key === 'Enter') {
                          e.preventDefault();
                          handleQuickUpdate(student.id, 'father_phone', e.currentTarget.value, true);
                        }
                        if(e.key === 'Escape') {
                          setEditingCell(null);
                        }
                      }}
                      className="border border-green-600 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  ) : (
                    student.father_phone || '---'
                  )}
                </td>

                {/* هاتف الأم - تعديل مباشر */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 cursor-pointer"
                    onClick={() => setEditingCell({ studentId: student.id, field: 'mother_phone' })}
                >
                  {editingCell?.studentId === student.id && editingCell?.field === 'mother_phone' ? (
                    <input
                      type="tel"
                      defaultValue={student.mother_phone || ''}
                      autoFocus
                      onBlur={(e) => handleQuickUpdate(student.id, 'mother_phone', e.target.value, false)}
                      onKeyDown={(e) => {
                        if(e.key === 'Enter') {
                          e.preventDefault();
                          handleQuickUpdate(student.id, 'mother_phone', e.currentTarget.value, true);
                        }
                        if(e.key === 'Escape') {
                          setEditingCell(null);
                        }
                      }}
                      className="border border-green-600 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  ) : (
                    student.mother_phone || '---'
                  )}
                </td>

                {/* نوع الاتصال المختار (اختيار من 4 خيارات) */}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <select
                    value={student.contact_preference || 'guardian_pref'}
                    onChange={(e) => handleGuardianTypeChange(student.id, e.target.value as any)}
                    className="border rounded px-2 py-1 w-full text-sm focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="student">التلميذ</option>
                    <option value="father">الأب</option>
                    <option value="mother">الأم</option>
                    <option value="guardian_pref">ولي الأمر المفضل</option>
                  </select>
                </td>

                {/* رقم الاتصال الفعلي (يتغير تلقائياً حسب الاختيار) */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600 font-mono">
                  {(() => {
                    const pref = student.contact_preference || 'guardian_pref';
                    if (pref === 'student') return student.phone || '---';
                    if (pref === 'father') return student.father_phone || '---';
                    if (pref === 'mother') return student.mother_phone || '---';
                    return student.guardian_phone || '---';
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-center text-gray-600">
        <Users className="inline w-5 h-5 ml-2" />
        عدد التلاميذ: {filteredStudents.length}
      </div>

      {/* ملاحظات مهمة */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-bold text-yellow-900 mb-2">📋 ملاحظات مهمة:</h3>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>✓ انقر على أي رقم هاتف للتعديل عليه مباشرة</li>
          <li>✓ اضغط <span className="font-bold">Enter</span> للانتقال إلى صف التلميذ التالي في نفس العمود</li>
          <li>✓ اختر نوع الاتصال المفضل من dropdown</li>
          <li>✓ رقم الاتصال الفعلي سيظهر تلقائياً بناءً على اختيارك</li>
          <li>✓ سيتم إرسال الرسائل إلى الرقم المعروض في العمود الأخير</li>
        </ul>
      </div>
    </div>
  );
}

export default GuardianPhoneManagement;

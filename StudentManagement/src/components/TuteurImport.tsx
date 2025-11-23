import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { dbManager } from '../utils/database';
import { Upload, FileSpreadsheet, X, FolderOpen, AlertTriangle, CheckCircle } from 'lucide-react';
import ProgressBar from './ProgressBar'; // افتراض وجود هذا المكون

// --- دالة توحيد أرقام الهواتف ---
const normalizePhone = (raw: string | number | undefined): string => {
  if (raw === undefined || raw === null) return '';
  const v = raw.toString().replace(/\s|-/g, '');
  if (/^0[67]\d{8}$/.test(v)) return v;
  if (/^\+212[67]\d{8}$/.test(v)) return '0' + v.substring(4);
  if (/^212[67]\d{8}$/.test(v)) return '0' + v.substring(3);
  return '';
};

// --- واجهة لنتائج المعالجة ---
interface ProcessResult {
  fileName: string;
  updated: number;
  skipped: number;
  errors: string[];
}

// --- المكون الرئيسي ---
export default function TuteurImport() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ProcessResult[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // --- دوال التعامل مع الملفات ---
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.xlsx') || f.name.endsWith('.xls'));
    if (droppedFiles.length > 0) setFiles(prev => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) setFiles(prev => [...prev, ...selectedFiles]);
    e.target.value = ''; // لإتاحة إعادة اختيار نفس الملف
  }, []);

  const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index));
  const clearFiles = () => { setFiles([]); setResults([]); };

  // --- دالة الاستيراد الرئيسية ---
  const handleImport = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    setResults([]);

    const allResults: ProcessResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileResult: ProcessResult = { fileName: file.name, updated: 0, skipped: 0, errors: [] };

      try {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'buffer' });
        const ws = wb.Sheets['Tuteur'];

        if (!ws) {
          fileResult.errors.push("لم يتم العثور على ورقة عمل بالاسم 'Tuteur'.");
          allResults.push(fileResult);
          continue;
        }

        const data = XLSX.utils.sheet_to_json<any>(ws, { header: 1, range: 9 }); // يبدأ من الصف 10

        for (let j = 0; j < data.length; j++) {
          const row = data[j];
          const studentCode = row[2]?.toString().trim(); // العمود C

          if (!studentCode) continue;

                            const guardianData = {
                    guardianship_type: row[5]?.toString().trim() || null,  // F
                    father_cin: row[14]?.toString().trim() || '',          // O
                    father_first_name_ar: row[15]?.toString().trim() || '', // P
                    father_last_name_ar: row[16]?.toString().trim() || '',  // Q
                    father_job: row[19]?.toString().trim() || '',          // T
                    father_phone: normalizePhone(row[20]),                 // U
                    father_address: row[21]?.toString().trim() || '',      // V
                    mother_cin: row[22]?.toString().trim() || '',          // W
                    mother_first_name_ar: row[23]?.toString().trim() || '', // X
                    mother_last_name_ar: row[24]?.toString().trim() || '',  // Y
                    mother_job: row[27]?.toString().trim() || '',          // AB
                    mother_phone: normalizePhone(row[28]),                 // AC
                    mother_address: row[29]?.toString().trim() || '',      // AD
                    // هنا الإضافة الجديدة
                    guardian_phone: normalizePhone(row[20]) || normalizePhone(row[28]) || "",  // ولي الأمر بالذكاء
                    };



          const ok = await dbManager.updateStudentGuardianInfo(studentCode, guardianData);
          
          if (ok) {
            fileResult.updated++;
          } else {
            fileResult.skipped++;
          }

          setProgress(Math.round(((i * data.length + j + 1) / (files.length * data.length)) * 100));
        }
      } catch (err: any) {
        fileResult.errors.push(`خطأ فادح: ${err.message || 'خطأ غير معروف'}`);
      }
      allResults.push(fileResult);
    }

    setResults(allResults);
    setIsProcessing(false);
  };

  // --- واجهة المستخدم ---
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">استيراد بيانات الأولياء</h1>
        <p className="text-gray-600">تحديث بيانات أولياء الأمور في جدول التلاميذ من ورقة "Tuteur" في ملف Excel.</p>
      </div>

      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
        {!isProcessing && (
          <div 
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 mb-4 transition-all duration-200 ${dragActive ? 'border-blue-500 bg-blue-50 scale-105' : 'border-gray-300'}`}
          >
            <input type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="hidden" id="tuteur-file-upload" multiple disabled={isProcessing}/>
            <label htmlFor="tuteur-file-upload" className={`cursor-pointer flex flex-col items-center w-full ${isProcessing ? 'cursor-not-allowed' : ''}`}>
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-3"><FolderOpen className="w-6 h-6 text-blue-600" /></div>
              <span className="text-lg font-medium text-gray-700 mb-2">ملفات بيانات الأولياء</span>
              <span className="text-sm text-gray-500">انقر لاختيار ملفات Excel أو اسحبها وأفلتها هنا</span>
            </label>
          </div>
        )}

        {files.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">الملفات المحددة ({files.length})</h4>
              {!isProcessing && <button onClick={clearFiles} className="text-sm font-medium text-red-600 hover:text-red-800">مسح الكل</button>}
            </div>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-3"><FileSpreadsheet className="w-5 h-5 text-gray-500" /><p className="text-sm font-medium text-gray-800">{file.name}</p></div>
                  {!isProcessing && <button onClick={() => removeFile(index)} className="text-red-500 hover:text-red-700 p-1 rounded"><X className="w-4 h-4" /></button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {isProcessing ? (
          <ProgressBar percentage={progress} />
        ) : (
          <button onClick={handleImport} disabled={files.length === 0 || isProcessing} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all">
            <Upload className="w-5 h-5" />
            <span>{`بدء تحديث بيانات الأولياء (${files.length} ملف)`}</span>
          </button>
        )}

        {results.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-3">نتائج الاستيراد:</h3>
            <div className="space-y-4">
              {results.map((res, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                  <p className="font-semibold text-gray-800 mb-2">{res.fileName}</p>
                  <div className="flex space-x-4 text-sm">
                    <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> <span>تحديث: {res.updated}</span></span>
                    <span className="flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-yellow-500" /> <span>تجاهل: {res.skipped}</span></span>
                  </div>
                  {res.errors.length > 0 && (
                    <div className="mt-2 text-red-600 text-sm">
                      <p className="font-semibold">أخطاء:</p>
                      <ul className="list-disc list-inside">
                        {res.errors.map((err, i) => <li key={i}>{err}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

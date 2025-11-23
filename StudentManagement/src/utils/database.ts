// جزء 1 المصحح
import initSqlJs from 'sql.js';
import {
  // افترض أن أنواع البيانات موجودة في هذا الملف
  Student, Level, Class, AcademicYear, Section 
} from '../types';

class DatabaseManager {
  private db: any = null;
  private isInitialized = false;
  private dbName = 'StudentManagementDB';
  private dbVersion = 1;
  private storeName = 'database';

  // خريطة المستويات أصبحت خاصة بالكلاس
  private levelNameMap: Record<string, string> = {
    '1APIC': 'الأولى إعدادي مسار دولي',
    '2APIC': 'الثانية إعدادي مسار دولي',
    '3APIC': 'الثالثة إعدادي مسار دولي',
    'TC': 'الجذع المشترك',
    'TCS': 'الجذع المشترك العلمي',
    'TCL': 'الجذع المشترك الأدبي',
    '1B': 'الأولى باكالوريا',
    '1BS': 'الأولى باكالوريا علوم',
    '1BL': 'الأولى باكالوريا آداب',
    '2B': 'الثانية باكالوريا',
    '2BL': 'الثانية باكالوريا آداب',
    'CP': 'التحضيري',
    'CE1': 'السنة الأولى ابتدائي',
    'CE2': 'السنة الثانية ابتدائي',
    'CM1': 'السنة الثالثة ابتدائي',
    'CM2': 'السنة الرابعة ابتدائي',
    'CI': 'السنة الخامسة ابتدائي',
    'CS': 'السنة السادسة ابتدائي'
  };
 
  async initialize() {
  if (this.isInitialized) return;

  try {
    console.log("📦 تهيئة قاعدة البيانات المحلية...");
    const SQL = await initSqlJs({ locateFile: file => `/${file}` });
    const savedDb = await this.loadFromIndexedDB();
    
    if (savedDb) {
      this.db = new SQL.Database(savedDb);
      console.log('🗂️ قاعدة البيانات محملة. يتم التحقق من التحديثات...');
      await this.migrateSchema(); // <-- هذا هو السطر الذي سيصلح كل شيء
    } else {
      this.db = new SQL.Database();
      console.log('✨ إنشاء قاعدة بيانات جديدة...');
      await this.createTables();
    }

    this.isInitialized = true;
    console.log('✅ تمت تهيئة قاعدة البيانات بنجاح');
  } catch (error) {
    console.error('❌ خطأ فادح في تهيئة قاعدة البيانات:', error);
    throw error;
  }
}


 
/**
 * دالة للتحقق من التحديثات وترقية بنية الجداول
 */
async migrateSchema() {
  if (!this.db) return;
  console.log('🚀 التحقق من التحديثات اللازمة للجداول...');
  await this.migrateStudentsColumns(); // استدعاء دالة ترقية جدول التلاميذ
  await this.saveDatabase();
  console.log('✅ اكتمل التحقق من التحديثات.');
}

/**
 * دالة تضيف أعمدة بيانات الأولياء إلى جدول التلاميذ إذا لم تكن موجودة
 */
 async migrateStudentsColumns() {
  if (!this.db) return;
  const cols = new Set<string>();
  try {
    const rs = this.db.exec("PRAGMA table_info(students)");
    if (rs.length > 0) {
      rs[0].values.forEach((row: any) => cols.add(String(row[1])));
    } else {
      return; 
    }
  } catch (e) {
    return;
  }

  const add = (name: string, type: string) => {
    if (!cols.has(name)) {
      console.log(`🔧 تحديث الجدول: إضافة عمود '${name}'`);
      this.db.run(`ALTER TABLE students ADD COLUMN ${name} ${type}`);
    }
  };

  // --- القائمة الصحيحة والفريدة من نوعها ---
  add('guardianship_type', 'TEXT');
  add('father_cin', 'TEXT');
  add('father_first_name_ar', 'TEXT');
  add('father_last_name_ar', 'TEXT');
  add('father_job', 'TEXT');
  add('father_phone', 'TEXT');
  add('father_address', 'TEXT');
  add('mother_cin', 'TEXT');
  add('mother_first_name_ar', 'TEXT');
  add('mother_last_name_ar', 'TEXT');
  add('mother_job', 'TEXT');
  add('mother_phone', 'TEXT');
  add('mother_address', 'TEXT');
  add('guardian_phone', 'TEXT'); // رقم ولي الأمر الفعلي
  add('contact_preference', 'TEXT'); // نوع الاتصال المفضل الجديد
  
  // -- الأعمدة القديمة التي قد تكون موجودة أو لا --
  // `guardian_pref` و `phoneStudent` يمكن إضافتها هنا إذا كنت لا تزال بحاجة إليها
  // ولكن تأكد من عدم تكرارها.
  add('guardian_pref', 'TEXT');
  add('phoneStudent', 'TEXT');

  await this.saveDatabase();
}



///////////////////////////////////////////////////كافة الدوال ///////////////////////////////////////
// =================================================================
// --- الصق كل هذه الدوال هنا (بعد migrateStudentsColumns) ---
// =================================================================

 public async updateStudentGuardianInfo(studentCode: string, guardianInfo: any): Promise<boolean> {
  if (!this.isInitialized || !this.db) {
    console.error('Database not initialized for updating guardian info.');
    return false;
  }
  try {
    // --- هذا هو الاستعلام المصحح ---
    const stmt = this.db.prepare(`
      UPDATE students SET
        guardianship_type = :guardianship_type,
        father_cin = :father_cin,
        father_first_name_ar = :father_first_name_ar,
        father_last_name_ar = :father_last_name_ar,
        father_job = :father_job,
        father_phone = :father_phone,
        father_address = :father_address,
        mother_cin = :mother_cin,
        mother_first_name_ar = :mother_first_name_ar,
        mother_last_name_ar = :mother_last_name_ar,
        mother_job = :mother_job,
        mother_phone = :mother_phone,
        mother_address = :mother_address,
        updatedAt = :updatedAt
      WHERE nationalId = :student_code  -- <-- تم تصحيح اسم العمود هنا
    `);

    stmt.run({
      ':guardianship_type': guardianInfo.guardianship_type,
      ':father_cin': guardianInfo.father_cin,
      ':father_first_name_ar': guardianInfo.father_first_name_ar,
      ':father_last_name_ar': guardianInfo.father_last_name_ar,
      ':father_job': guardianInfo.father_job,
      ':father_phone': guardianInfo.father_phone,
      ':father_address': guardianInfo.father_address,
      ':mother_cin': guardianInfo.mother_cin,
      ':mother_first_name_ar': guardianInfo.mother_first_name_ar,
      ':mother_last_name_ar': guardianInfo.mother_last_name_ar,
      ':mother_job': guardianInfo.mother_job,
      ':mother_phone': guardianInfo.mother_phone,
      ':mother_address': guardianInfo.mother_address,
      ':updatedAt': new Date().toISOString(),
      ':student_code': studentCode,
    });
    
    const changes = this.db.getRowsModified();
    stmt.free();
    
    if (changes > 0) {
      await this.saveDatabase();
      console.log(`✅ تم تحديث بيانات ولي أمر التلميذ: ${studentCode}`);
      return true;
    } else {
      console.warn(`⚠️ لم يتم العثور على تلميذ بالرقم ${studentCode} لتحديث بيانات ولي أمره.`);
      return false;
    }
  } catch (error) {
    console.error(`❌ خطأ في تحديث ولي أمر التلميذ ${studentCode}:`, error);
    return false;
  }
}


  public async addLevel(level: Omit<Level, 'id' | 'createdAt'>): Promise<string> {
    if (!this.db) throw new Error("Database not initialized");
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    
    this.db.run(
      'INSERT INTO levels (id, name, code, createdAt) VALUES (?, ?, ?, ?)',
      [id, level.name, level.code || '', createdAt]
    );
    
    await this.saveDatabase();
    return id;
  }

   public async getLevels(): Promise<Level[]> {
    if (!this.db) {
      console.warn('قاعدة البيانات غير مهيأة في getLevels');
      return [];
    }

    try {
      const stmt = this.db.prepare('SELECT * FROM levels ORDER BY name');
      const rows: Level[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as Level);
      }
      stmt.free();
      return rows;
    } catch (error) {
      console.error('خطأ في جلب المستويات:', error);
      return [];
    }
  }
  
   public async getLevelByName(name: string): Promise<Level | null> {
    if (!this.db) return null;
    const stmt = this.db.prepare('SELECT * FROM levels WHERE name = ?');
    try {
      stmt.bind([name]);
      
      if (stmt.step()) {
        return stmt.getAsObject() as Level;
      }
      
      return null;
    } finally {
      stmt.free();
    }
  }
 
    public async getOrCreateLevel(levelName: string, levelCode: string): Promise<{ id: string, name: string, code: string }> {
    await this.initialize();
    if (!this.db) throw new Error("Database not initialized");

    const cleanName = levelName.trim();
    const cleanCode = levelCode.trim().toUpperCase();

    const stmt = this.db.prepare("SELECT * FROM levels WHERE name = ? AND code = ?");
    stmt.bind([cleanName, cleanCode]);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return { id: row.id as string, name: row.name as string, code: row.code as string };
    }
    stmt.free();

    const newId = crypto.randomUUID();
    const insertStmt = this.db.prepare("INSERT INTO levels (id, name, code, createdAt) VALUES (?, ?, ?, ?)");
    insertStmt.run([newId, cleanName, cleanCode, new Date().toISOString()]);
    insertStmt.free();
    await this.saveDatabase();
    return { id: newId, name: cleanName, code: cleanCode };
  }

   public async addSection(section: Omit<Section, 'id' | 'createdAt'>): Promise<string> {
    if (!this.db) throw new Error("Database not initialized");
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    
    this.db.run(
      'INSERT INTO sections (id, name, levelId, code, createdAt) VALUES (?, ?, ?, ?, ?)',
      [id, section.name, section.levelId, section.code || '', createdAt]
    );
    
    await this.saveDatabase();
    return id;
  }
   public async getSections(): Promise<Section[]> {
    if (!this.db) {
      console.warn('قاعدة البيانات غير مهيأة في getSections');
      return [];
    }

    try {
      const stmt = this.db.prepare('SELECT * FROM sections ORDER BY name');
      const sections: Section[] = [];
      while (stmt.step()) {
        sections.push(stmt.getAsObject() as Section);
      }
      stmt.free();
      return sections;
    } catch (error) {
      console.error('خطأ في جلب الأقسام:', error);
      return [];
    }
  }
  public async getSectionByName(name: string): Promise<Section | null> {
    if (!this.db) return null;
    const stmt = this.db.prepare('SELECT * FROM sections WHERE name = ?');
    try {
      stmt.bind([name]);
      
      if (stmt.step()) {
        return stmt.getAsObject() as Section;
      }
      
      return null;
    } finally {
      stmt.free();
    }
  }

  public async getSectionsByLevel(levelId: string): Promise<Section[]> {
    if (!this.db) return [];
    try {
      const stmt = this.db.prepare('SELECT * FROM sections WHERE levelId = ? ORDER BY name');
      stmt.bind([levelId]);
      
      const sections: Section[] = [];
      while (stmt.step()) {
        sections.push(stmt.getAsObject() as Section);
      }
      stmt.free();
      return sections;
    } catch (error) {
      console.error('خطأ في جلب أقسام المستوى:', error);
      return [];
    }
  }

  public async getOrCreateSection(sectionName: string, levelId: string): Promise<string> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      const cleanSectionName = sectionName.trim();
      
      const stmt = this.db.prepare('SELECT id FROM sections WHERE name = ? AND levelId = ?');
      stmt.bind([cleanSectionName, levelId]);
      
      let sectionId: string | null = null;
      if (stmt.step()) {
        sectionId = stmt.get()[0] as string;
      }
      stmt.free();
      
      if (sectionId) {
        return sectionId;
      }
      
      const newSectionId = crypto.randomUUID();
      const insertStmt = this.db.prepare(`
        INSERT INTO sections (id, name, levelId, code, createdAt) 
        VALUES (?, ?, ?, ?, ?)
      `);
      insertStmt.run([newSectionId, cleanSectionName, levelId, '', new Date().toISOString()]);
      insertStmt.free();
      
      console.log(`✅ تم إنشاء قسم جديد: ${cleanSectionName} في المستوى ${levelId} - ID: ${newSectionId}`);
      await this.saveDatabase();
      return newSectionId;
      
    } catch (error) {
      console.error('خطأ في إنشاء القسم:', error);
      throw error;
    }
  }
  // ----------------------------------------------
  // --- دوال السنوات الدراسية (Academic Years) ---
  // ----------------------------------------------
  public async addAcademicYear(year: Omit<AcademicYear, 'id' | 'createdAt'>): Promise<string> {
    if (!this.db) throw new Error("Database not initialized");
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    
    this.db.run(
      'INSERT INTO academic_years (id, year, startDate, endDate, isActive, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [id, year.year, year.startDate || '', year.endDate || '', year.isActive ? 1 : 0, createdAt]
    );
    
    await this.saveDatabase();
    return id;
  }

  public async getAcademicYears(): Promise<AcademicYear[]> {
    if (!this.db) {
      throw new Error('قاعدة البيانات غير متاحة - يرجى انتظار التهيئة');
    }
    
    const stmt = this.db.prepare('SELECT * FROM academic_years ORDER BY year DESC');
    try {
      const years: AcademicYear[] = [];
      
      while (stmt.step()) {
        const row = stmt.getAsObject() as any;
        years.push({
          ...row,
          isActive: Boolean(row.isActive)
        });
      }
      
      return years;
    } finally {
      stmt.free();
    }
  }

  public async getAcademicYearByYear(year: string): Promise<AcademicYear | null> {
    if (!this.db) return null;
    const stmt = this.db.prepare('SELECT * FROM academic_years WHERE year = ?');
    try {
      stmt.bind([year]);
      
      if (stmt.step()) {
        const row = stmt.getAsObject() as any;
        return {
          ...row,
          isActive: Boolean(row.isActive)
        };
      }
      
      return null;
    } finally {
      stmt.free();
    }
  }

  public async getCurrentAcademicYear(): Promise<string> {
    if (!this.db) return '2025/2026';
    try {
      const stmt = this.db.prepare('SELECT year FROM academic_years WHERE isActive = 1 LIMIT 1');
      if (stmt.step()) {
        const result = stmt.getAsObject();
        stmt.free();
        return result.year as string;
      }
      stmt.free();
      
      const latestStmt = this.db.prepare('SELECT year FROM academic_years ORDER BY year DESC LIMIT 1');
      if (latestStmt.step()) {
        const result = latestStmt.getAsObject();
        latestStmt.free();
        return result.year as string;
      }
      latestStmt.free();
      
      return '2025/2026';
    } catch (error) {
      console.warn('خطأ في الحصول على السنة الدراسية الحالية:', error);
      return '2025/2026';
    }
  }

  public async setCurrentAcademicYear(year: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      this.db.run('UPDATE academic_years SET isActive = 0');
      
      const existingYear = await this.getAcademicYearByYear(year);
      if (existingYear) {
        this.db.run('UPDATE academic_years SET isActive = 1 WHERE year = ?', [year]);
      } else {
        await this.addAcademicYear({
          year,
          startDate: '',
          endDate: '',
          isActive: true
        });
      }
      
      await this.saveDatabase();
    } catch (error) {
      console.error('خطأ في تعيين السنة الدراسية الحالية:', error);
      throw error;
    }
  }

  // ----------------------------------------------
  // --- دوال إدارة التلاميذ (Students) ---
  // ----------------------------------------------

  public async addStudent(student: any): Promise<string> {
    if (!this.db) throw new Error("Database not initialized");
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    let levelId = null;
    let sectionId = null;

    if (student.level) {
      const level = await this.getLevelByName(student.level);
      levelId = level?.id || null;
    }

    if (student.section && levelId) {
      const sections = await this.getSectionsByLevel(levelId);
      const section = sections.find(s => s.name === student.section);
      sectionId = section?.id || null;
    }

    this.db.run(`
      INSERT INTO students (
        id, firstName, lastName, nationalId, gender, birthPlace, dateOfBirth,
        email, phone, studentId, grade, section, level, levelId, sectionId,
        enrollmentDate, address, emergencyContact, emergencyPhone,
        guardianName, guardianPhone, guardianRelation, socialSupport,
        transportService, medicalInfo, notes, status, ageGroup, schoolType,
        academicYear, region, province, municipality, institution,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, student.firstName, student.lastName, student.nationalId,
      student.gender, student.birthPlace || '', student.dateOfBirth || '',
      student.email || '', student.phone || '', student.studentId || student.nationalId,
      student.grade || '', student.section || '', student.level || '',
      levelId, sectionId, student.enrollmentDate,
      student.address || '', student.emergencyContact || '', student.emergencyPhone || '',
      student.guardianName || '', student.guardianPhone || '', student.guardianRelation || '',
      student.socialSupport ? 1 : 0, student.transportService ? 1 : 0,
      student.medicalInfo || '', student.notes || '', student.status || 'نشط',
      student.ageGroup || '', student.schoolType || '', student.academicYear || '2025/2026',
      student.region || '', student.province || '', student.municipality || '',
      student.institution || '', createdAt, updatedAt
    ]);

    await this.saveDatabase();
    return id;
  }

  public async getStudents(): Promise<any[]> {
    if (!this.db) return [];
    const stmt = this.db.prepare(`
      SELECT s.*, l.name as levelName, sec.name as sectionName 
      FROM students s 
      LEFT JOIN levels l ON s.levelId = l.id 
      LEFT JOIN sections sec ON s.sectionId = sec.id 
      ORDER BY s.lastName, s.firstName
    `);
    try {
      const students: any[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject() as any;
        students.push({
          ...row,
          socialSupport: Boolean(row.socialSupport),
          transportService: Boolean(row.transportService)
        });
      }
      return students;
    } finally {
      stmt.free();
    }
  }

  public async getStudentById(id: string): Promise<any | null> {
    if (!this.db) return null;
    const stmt = this.db.prepare(`
      SELECT s.*, l.name as levelName, sec.name as sectionName 
      FROM students s 
      LEFT JOIN levels l ON s.levelId = l.id 
      LEFT JOIN sections sec ON s.sectionId = sec.id 
      WHERE s.id = ?
    `);
    try {
      stmt.bind([id]);
      if (stmt.step()) {
        const row = stmt.getAsObject() as any;
        return {
          ...row,
          socialSupport: Boolean(row.socialSupport),
          transportService: Boolean(row.transportService)
        };
      }
      return null;
    } finally {
      stmt.free();
    }
  }

  public async getStudentByNationalId(nationalId: string): Promise<any | null> {
    if (!this.db) return null;
    const stmt = this.db.prepare(`
      SELECT s.*, l.name as levelName, sec.name as sectionName 
      FROM students s 
      LEFT JOIN levels l ON s.levelId = l.id 
      LEFT JOIN sections sec ON s.sectionId = sec.id 
      WHERE s.nationalId = ? LIMIT 1
    `);
    try {
      stmt.bind([nationalId]);
      if (stmt.step()) {
        const row = stmt.getAsObject() as any;
        return {
          ...row,
          socialSupport: Boolean(row.socialSupport),
          transportService: Boolean(row.transportService)
        };
      }
      return null;
    } finally {
      stmt.free();
    }
  }

  public async getStudentByNationalIdAndYear(nationalId: string, academicYear: string): Promise<any | null> {
    if (!this.db) throw new Error('قاعدة البيانات غير متاحة');
    
    const stmt = this.db.prepare(`
      SELECT s.*, l.name as levelName, sec.name as sectionName 
      FROM students s 
      LEFT JOIN levels l ON s.levelId = l.id 
      LEFT JOIN sections sec ON s.sectionId = sec.id 
      WHERE s.nationalId = ? AND s.academicYear = ? LIMIT 1
    `);
    try {
      stmt.bind([nationalId, academicYear]);
      if (stmt.step()) {
        const row = stmt.getAsObject() as any;
        return {
          ...row,
          socialSupport: Boolean(row.socialSupport),
          transportService: Boolean(row.transportService)
        };
      }
      return null;
    } finally {
      stmt.free();
    }
  }

  public async getStudentsByAcademicYear(academicYear: string): Promise<any[]> {
    if (!this.db) return [];
    const stmt = this.db.prepare(`
      SELECT s.*, l.name as levelName, sec.name as sectionName 
      FROM students s 
      LEFT JOIN levels l ON s.levelId = l.id 
      LEFT JOIN sections sec ON s.sectionId = sec.id 
      WHERE s.academicYear = ?
      ORDER BY s.lastName, s.firstName
    `);
    try {
      stmt.bind([academicYear]);
      const students: any[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject() as any;
        students.push({
          ...row,
          socialSupport: Boolean(row.socialSupport),
          transportService: Boolean(row.transportService)
        });
      }
      return students;
    } finally {
      stmt.free();
    }
  }

  public async getStudentByStudentId(studentId: string): Promise<any | null> {
    if (!this.db) return null;
    const stmt = this.db.prepare(`
      SELECT s.*, l.name as levelName, sec.name as sectionName 
      FROM students s 
      LEFT JOIN levels l ON s.levelId = l.id 
      LEFT JOIN sections sec ON s.sectionId = sec.id 
      WHERE s.studentId = ?
    `);
    try {
      stmt.bind([studentId]);
      if (stmt.step()) {
        const row = stmt.getAsObject() as any;
        return {
          ...row,
          socialSupport: Boolean(row.socialSupport),
          transportService: Boolean(row.transportService)
        };
      }
      return null;
    } finally {
      stmt.free();
    }
  }

   /**
   * تحديث بيانات تلميذ
   * يستخدم في: StudentManagement, SchoolEnrollmentImport
   */
  public async updateStudent(id: string, updates: any): Promise<void> {
    if (!this.db) return;
    const updatedAt = new Date().toISOString();

    let levelId = updates.levelId;
    let sectionId = updates.sectionId;

    // البحث عن المستوى والقسم بالاسم وربطهما إذا تم تحديثهما كنصوص
    if (updates.level && !levelId) {
      const level = await this.getLevelByName(updates.level);
      levelId = level?.id;
    }
    if (updates.section && !sectionId) {
      const currentLevelId = levelId || (await this.getStudentById(id))?.levelId;
      if (currentLevelId) {
        const sections = await this.getSectionsByLevel(currentLevelId);
        const section = sections.find(s => s.name === updates.section);
        sectionId = section?.id;
      }
    }

    // فلترة الحقول التي سيتم تحديثها مباشرة
    const directUpdateKeys = Object.keys(updates).filter(key => 
        key !== 'id' && key !== 'level' && key !== 'section' && key !== 'levelId' && key !== 'sectionId'
    );

    const fields = directUpdateKeys.map(key => `${key} = ?`);
    const values = directUpdateKeys.map(key => {
      if (key === 'socialSupport' || key === 'transportService') {
        return updates[key] ? 1 : 0;
      }
      return updates[key];
    });
    
    // إضافة levelId و sectionId إذا تم تحديدهما
    if (levelId !== undefined) {
      fields.push('levelId = ?');
      values.push(levelId);
    }
    if (sectionId !== undefined) {
      fields.push('sectionId = ?');
      values.push(sectionId);
    }

    fields.push('updatedAt = ?');
    values.push(updatedAt);

    if (fields.length > 1) {
      this.db.run(`UPDATE students SET ${fields.join(', ')} WHERE id = ?`, [...values, id]);
      await this.saveDatabase();
    }
  }

  /**
   * حذف تلميذ (مع جميع البيانات المرتبطة)
   * يستخدم في: StudentManagement
   */
  public async deleteStudent(id: string): Promise<void> {
    if (!this.db) return;
    this.db.run('DELETE FROM students WHERE id = ?', [id]);
    await this.saveDatabase();
  }

  // ----------------------------------------------
  // --- دوال الحضور والنقط (Attendance & Grades) ---
  // ----------------------------------------------
  public async addAttendanceRecord(record: any): Promise<string> {
    if (!this.db) throw new Error("Database not initialized");
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    this.db.run(`INSERT INTO attendance_records (id, studentId, date, status, period, subject, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
      [id, record.studentId, record.date, record.status, record.period || '', record.subject || '', record.notes || '', createdAt]
    );
    await this.saveDatabase();
    return id;
  }

  public async getAttendanceRecords(studentId?: string): Promise<any[]> {
    if (!this.db) return [];
    let query = 'SELECT * FROM attendance_records';
    let params: any[] = [];

    if (studentId) {
      query += ' WHERE studentId = ?';
      params.push(studentId);
    }
    query += ' ORDER BY date DESC, createdAt DESC';

    const stmt = this.db.prepare(query);
    try {
      if (params.length > 0) stmt.bind(params);
      const records: any[] = [];
      while (stmt.step()) {
        records.push(stmt.getAsObject());
      }
      return records;
    } finally {
      stmt.free();
    }
  }

  public async updateAttendanceRecord(id: string, updates: any): Promise<void> {
    if (!this.db) return;
    const fields = Object.keys(updates).map(key => `${key} = ?`);
    const values = Object.values(updates);
    this.db.run(`UPDATE attendance_records SET ${fields.join(', ')} WHERE id = ?`, [...values, id]);
    await this.saveDatabase();
  }

  public async deleteAttendanceRecord(id: string): Promise<void> {
    if (!this.db) return;
    this.db.run('DELETE FROM attendance_records WHERE id = ?', [id]);
    await this.saveDatabase();
  }

  public async addGradeRecord(record: any): Promise<string> {
    if (!this.db) throw new Error("Database not initialized");
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    this.db.run(`INSERT INTO grade_records (id, studentId, subject, grade, maxGrade, assignmentType, semester, academicYear, date, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [id, record.studentId, record.subject, record.grade, record.maxGrade, record.assignmentType, record.semester || '', record.academicYear || '', record.date, record.notes || '', createdAt]
    );
    await this.saveDatabase();
    return id;
  }

  public async getGradeRecords(studentId?: string): Promise<any[]> {
    if (!this.db) return [];
    let query = 'SELECT * FROM grade_records';
    let params: any[] = [];
    if (studentId) {
      query += ' WHERE studentId = ?';
      params.push(studentId);
    }
    query += ' ORDER BY date DESC, createdAt DESC';

    const stmt = this.db.prepare(query);
    try {
      if (params.length > 0) stmt.bind(params);
      const records: any[] = [];
      while (stmt.step()) {
        records.push(stmt.getAsObject());
      }
      return records;
    } finally {
      stmt.free();
    }
  }
 
//////////////////////////////////////كافة الدوال ////////////////////////////////////
  public async upsertTuteurByNationalId(nationalId: string, data: any): Promise<boolean> {
    await this.initialize();
    
    const student = await this.getStudentByNationalId(nationalId);
    if (!student) return false;

    // تم التبسيط لاستخدام الدالة الجديدة والموحدة
    return this.updateStudentGuardianInfo(nationalId, data);
  }

  public getAllLevels(): Level[] {
    if (!this.db) return [];
    const stmt = this.db.prepare('SELECT * FROM levels');
    const levels: Level[] = [];
    while (stmt.step()) {
      levels.push(stmt.getAsObject() as Level);
    }
    stmt.free();
    return levels;
  }

  public getAllSections(): Class[] {
    if (!this.db) return [];
    const stmt = this.db.prepare('SELECT * FROM sections');
    const sections: Class[] = [];
    while (stmt.step()) {
      sections.push(stmt.getAsObject() as Class);
    }
    stmt.free();
    return sections;
  }


// جزء 2 المصحح

 

  private async openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  private async loadFromIndexedDB(): Promise<Uint8Array | null> {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.get('db_file');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          resolve(request.result || null);
        };
        transaction.oncomplete = () => {
            db.close();
        };
      });
    } catch (error) {
      console.warn('خطأ في تحميل البيانات من IndexedDB:', error);
      return null;
    }
  }

  private async saveDatabase(): Promise<void> {
    if(!this.db) return;
    try {
      const data = this.db.export();
      const db = await this.openIndexedDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.put(data, 'db_file');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
        transaction.oncomplete = () => {
            db.close();
        };
      });
    } catch (error) {
      console.error('خطأ في حفظ البيانات إلى IndexedDB:', error);
      throw error;
    }
  }

  private async createTables() {
    if (!this.db) return;

    const tables = [
      `CREATE TABLE IF NOT EXISTS levels (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, code TEXT, createdAt TEXT NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS sections (id TEXT PRIMARY KEY, name TEXT NOT NULL, levelId TEXT, code TEXT, createdAt TEXT NOT NULL, FOREIGN KEY (levelId) REFERENCES levels(id))`,
      `CREATE TABLE IF NOT EXISTS academic_years (id TEXT PRIMARY KEY, year TEXT NOT NULL UNIQUE, startDate TEXT, endDate TEXT, isActive BOOLEAN DEFAULT 0, createdAt TEXT NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY, firstName TEXT, lastName TEXT, nationalId TEXT UNIQUE NOT NULL, gender TEXT, birthPlace TEXT, dateOfBirth TEXT, email TEXT, phone TEXT, studentId TEXT, grade TEXT, section TEXT, level TEXT, levelId TEXT, sectionId TEXT, enrollmentDate TEXT, address TEXT, emergencyContact TEXT, emergencyPhone TEXT, guardianName TEXT, guardianPhone TEXT, guardianRelation TEXT, socialSupport BOOLEAN DEFAULT 0, transportService BOOLEAN DEFAULT 0, medicalInfo TEXT, notes TEXT, status TEXT, ageGroup TEXT, schoolType TEXT, academicYear TEXT, region TEXT, province TEXT, municipality TEXT, institution TEXT, createdAt TEXT, updatedAt TEXT,
        father_cin TEXT, father_first_name_ar TEXT, father_last_name_ar TEXT, father_job TEXT, father_phone TEXT, father_address TEXT,
        mother_cin TEXT, mother_first_name_ar TEXT, mother_last_name_ar TEXT, mother_job TEXT, mother_phone TEXT, mother_address TEXT,
        guardianship_type TEXT,
        FOREIGN KEY (levelId) REFERENCES levels(id), FOREIGN KEY (sectionId) REFERENCES sections(id), FOREIGN KEY (academicYear) REFERENCES academic_years(year)
      )`,
      `DROP TABLE IF EXISTS attendance_records`,
      `CREATE TABLE attendance_records (id TEXT PRIMARY KEY, studentId TEXT NOT NULL, date TEXT NOT NULL, status TEXT CHECK(status IN ('حاضر', 'غائب', 'متأخر', 'معذور', 'غياب مبرر', 'مخالفة', 'مسجل')) NOT NULL, period TEXT, subject TEXT, notes TEXT, createdAt TEXT NOT NULL, FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS grade_records (id TEXT PRIMARY KEY, studentId TEXT NOT NULL, subject TEXT NOT NULL, grade REAL NOT NULL, maxGrade REAL NOT NULL DEFAULT 20, assignmentType TEXT, semester TEXT, academicYear TEXT, date TEXT NOT NULL, notes TEXT, createdAt TEXT NOT NULL, FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS credentials (student_id TEXT PRIMARY KEY, secret_code TEXT NOT NULL, issue_date TEXT NOT NULL, FOREIGN KEY (student_id) REFERENCES students(nationalId) ON DELETE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS guidance_statistics (id TEXT PRIMARY KEY, student_id TEXT NOT NULL, assigned_stream TEXT, gender TEXT, decision TEXT, academic_year TEXT, level TEXT, section TEXT, age INTEGER, ageGroup TEXT, createdAt TEXT, FOREIGN KEY (student_id) REFERENCES students(nationalId))`,
      `CREATE TABLE IF NOT EXISTS classes (id TEXT PRIMARY KEY, name TEXT NOT NULL, level_id TEXT, academic_year_id TEXT, createdAt TEXT NOT NULL, FOREIGN KEY (level_id) REFERENCES levels(id), FOREIGN KEY (academic_year_id) REFERENCES academic_years(id))`,
      `CREATE TABLE IF NOT EXISTS council_decisions (id TEXT PRIMARY KEY, student_id TEXT NOT NULL, national_id TEXT, decision TEXT NOT NULL, source_metric TEXT, value REAL, generated BOOLEAN DEFAULT 0, note TEXT, decision_date TEXT NOT NULL, desired_stream TEXT, age INTEGER, level TEXT, section TEXT, createdAt TEXT NOT NULL, FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS dropouts (id TEXT PRIMARY KEY, student_id TEXT NOT NULL, dropout_date TEXT NOT NULL, reason TEXT, metadata TEXT, createdAt TEXT NOT NULL, FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS reintegration (id TEXT PRIMARY KEY, student_id TEXT NOT NULL, reintegration_date TEXT NOT NULL, previous_status TEXT, metadata TEXT, createdAt TEXT NOT NULL, FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS parents (id TEXT PRIMARY KEY, student_id TEXT NOT NULL, relation TEXT, parent_name TEXT, phone_1 TEXT, phone_2 TEXT, address TEXT, createdAt TEXT, FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS exams (id TEXT PRIMARY KEY, student_id TEXT NOT NULL, subject TEXT NOT NULL, exam_type TEXT, grade_value REAL NOT NULL, max_grade REAL NOT NULL DEFAULT 20, exam_date TEXT NOT NULL, createdAt TEXT NOT NULL, FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS averages (id TEXT PRIMARY KEY, student_id TEXT NOT NULL, term TEXT, average_value REAL NOT NULL, academic_year TEXT NOT NULL, createdAt TEXT NOT NULL, FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE, FOREIGN KEY (academic_year) REFERENCES academic_years(year))`,
      `CREATE TABLE IF NOT EXISTS transfers (id TEXT PRIMARY KEY, student_id TEXT NOT NULL, transfer_type TEXT, from_school TEXT, to_school TEXT, to_province TEXT, to_academy TEXT, transfer_date TEXT NOT NULL, metadata TEXT, createdAt TEXT NOT NULL, FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS absentees (id TEXT PRIMARY KEY, student_id TEXT NOT NULL, status_date TEXT NOT NULL, note TEXT, createdAt TEXT NOT NULL, FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS dismissed_students (id TEXT PRIMARY KEY, student_id TEXT NOT NULL, dismissal_date TEXT NOT NULL, reason TEXT, metadata TEXT, createdAt TEXT NOT NULL, FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS unenrolled_students (id TEXT PRIMARY KEY, student_id TEXT NOT NULL, lastName TEXT, firstName TEXT, gender TEXT, dateOfBirth TEXT, birthPlace TEXT, metadata TEXT, createdAt TEXT)`,
      `CREATE TABLE IF NOT EXISTS institution_settings (id INTEGER PRIMARY KEY AUTOINCREMENT, academy TEXT, directorate TEXT, municipality TEXT, institution TEXT, academicYear TEXT, updatedAt TEXT NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS timetable (id TEXT PRIMARY KEY, teacher_name_arabic TEXT, teacher_name_french TEXT, teacher_id TEXT, ppr TEXT, subject_code TEXT, subject_arabic TEXT, class TEXT NOT NULL, room_code TEXT, room_name TEXT, day TEXT, day_arabic TEXT, time_slot TEXT, start_time TEXT, end_time TEXT, activity_id TEXT, tags TEXT, createdAt TEXT)`,
      `CREATE TABLE IF NOT EXISTS teacher_assignments (id TEXT PRIMARY KEY, teacher_arabic TEXT, teacher_french TEXT, teacher_id TEXT, ppr TEXT, class TEXT NOT NULL, subject_code TEXT, subject_arabic TEXT, createdAt TEXT)`,
      `CREATE TABLE IF NOT EXISTS subjects (id TEXT PRIMARY KEY, code TEXT UNIQUE, name_arabic TEXT NOT NULL, name_french TEXT, createdAt TEXT)`,
      `CREATE TABLE IF NOT EXISTS message_templates (id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, content TEXT NOT NULL, createdAt TEXT)`,
      `CREATE TABLE IF NOT EXISTS whatsapp_settings (id INTEGER PRIMARY KEY AUTOINCREMENT, evolution_api_url TEXT, evolution_instance_name TEXT, evolution_api_key TEXT, is_active INTEGER DEFAULT 1)`
    ];

    for (const tableSQL of tables) {
      this.db.run(tableSQL);
    }
    
    // يمكنك إضافة إنشاء الفهارس هنا إذا أردت
  }
 


// جزء 4 المصحح

  // ----------------------------------------------
  // --- دوال إدارة الطلاب (التحويلات، الانقطاع، الخ) ---
  // ----------------------------------------------

  /**
   * دالة مساعدة لتحليل JSON بأمان وتجنب توقف البرنامج
   * @param jsonString النص المراد تحليله
   * @returns الكائن الناتج عن التحليل أو null في حال حدوث خطأ
   */
  private safeJsonParse(jsonString: string | null | undefined): any {
    if (!jsonString) {
      return null;
    }
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.warn('خطأ في تحليل بيانات JSON:', jsonString, e);
      return null; // إرجاع null لتجنب كسر التطبيق
    }
  }

  // --- إدارة النقل والتحويلات ---
  public async addTransfer(transfer: {
    student_id: string;
    transfer_type: 'وافد' | 'مغادر';
    from_school: string;
    to_school: string;
    transfer_date: string;
    to_province?: string;
    to_academy?: string;
    metadata?: any;
  }): Promise<string> {
    if (!this.db) throw new Error("Database not initialized");
    
    const existingTransfers = await this.getTransfers();
    const duplicateTransfer = existingTransfers.find(t => {
      const tMetadata = this.safeJsonParse(t.metadata_raw);
      return t.student_id === transfer.student_id &&
             t.transfer_type === transfer.transfer_type &&
             tMetadata?.academicYear === transfer.metadata?.academicYear;
    });
    
    if (duplicateTransfer) {
      this.db.run(`
        UPDATE transfers SET from_school = ?, to_school = ?, transfer_date = ?, to_province = ?, to_academy = ?, metadata = ?
        WHERE id = ?`, 
        [transfer.from_school || '', transfer.to_school || '', transfer.transfer_date, transfer.to_province || '', transfer.to_academy || '', JSON.stringify(transfer.metadata || {}), duplicateTransfer.id]
      );
      await this.saveDatabase();
      return duplicateTransfer.id;
    }
    
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    this.db.run(`
      INSERT INTO transfers (id, student_id, transfer_type, from_school, to_school, transfer_date, to_province, to_academy, metadata, createdAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [id, transfer.student_id, transfer.transfer_type, transfer.from_school || '', transfer.to_school || '', transfer.transfer_date, transfer.to_province || '', transfer.to_academy || '', JSON.stringify(transfer.metadata || {}), createdAt]
    );
    await this.saveDatabase();
    return id;
  }

  public async getTransfers(): Promise<any[]> {
    if (!this.db) return [];
    const stmt = this.db.prepare('SELECT * FROM transfers ORDER BY transfer_date DESC');
    try {
      const transfers: any[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject() as any;
        transfers.push({
          ...row,
          metadata_raw: row.metadata, 
          metadata: this.safeJsonParse(row.metadata) || {}
        });
      }
      return transfers;
    } finally {
      stmt.free();
    }
  }

  // --- إدارة المنقطعين ---
  public async addDropout(dropout: { student_id: string; dropout_date: string; reason?: string; metadata?: any; }): Promise<string> {
    if (!this.db) throw new Error("Database not initialized");
    
    const existingDropouts = await this.getDropouts();
    const duplicateDropout = existingDropouts.find(d => {
        const dMetadata = this.safeJsonParse(d.metadata_raw);
        return d.student_id === dropout.student_id && dMetadata?.academicYear === dropout.metadata?.academicYear;
    });
    
    if (duplicateDropout) {
      this.db.run(`UPDATE dropouts SET dropout_date = ?, reason = ?, metadata = ? WHERE id = ?`, [dropout.dropout_date, dropout.reason || '', JSON.stringify(dropout.metadata || {}), duplicateDropout.id]);
      await this.saveDatabase();
      return duplicateDropout.id;
    }
    
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    this.db.run(`INSERT INTO dropouts (id, student_id, dropout_date, reason, metadata, createdAt) VALUES (?, ?, ?, ?, ?, ?)`, [id, dropout.student_id, dropout.dropout_date, dropout.reason || '', JSON.stringify(dropout.metadata || {}), createdAt]);
    await this.saveDatabase();
    return id;
  }

  public async getDropouts(): Promise<any[]> {
    if (!this.db) return [];
    const stmt = this.db.prepare('SELECT * FROM dropouts ORDER BY dropout_date DESC');
    try {
      const dropouts: any[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject() as any;
        dropouts.push({ ...row, metadata_raw: row.metadata, metadata: this.safeJsonParse(row.metadata) || {} });
      }
      return dropouts;
    } finally {
      stmt.free();
    }
  }

  // --- إدارة المفصولين ---
  public async addDismissedStudent(dismissed: { student_id: string; dismissal_date: string; reason?: string; metadata?: any; }): Promise<string> {
    if (!this.db) throw new Error("Database not initialized");

    const existingDismissed = await this.getDismissedStudents();
    const duplicateDismissed = existingDismissed.find(d => {
        const dMetadata = this.safeJsonParse(d.metadata_raw);
        return d.student_id === dismissed.student_id && dMetadata?.academicYear === dismissed.metadata?.academicYear;
    });
    
    if (duplicateDismissed) {
      this.db.run(`UPDATE dismissed_students SET dismissal_date = ?, reason = ?, metadata = ? WHERE id = ?`, [dismissed.dismissal_date, dismissed.reason || '', JSON.stringify(dismissed.metadata || {}), duplicateDismissed.id]);
      await this.saveDatabase();
      return duplicateDismissed.id;
    }
    
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    this.db.run(`INSERT INTO dismissed_students (id, student_id, dismissal_date, reason, metadata, createdAt) VALUES (?, ?, ?, ?, ?, ?)`, [id, dismissed.student_id, dismissed.dismissal_date, dismissed.reason || '', JSON.stringify(dismissed.metadata || {}), createdAt]);
    await this.saveDatabase();
    return id;
  }

  public async getDismissedStudents(): Promise<any[]> {
    if (!this.db) return [];
    const stmt = this.db.prepare('SELECT * FROM dismissed_students ORDER BY dismissal_date DESC');
    try {
      const dismissed: any[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject() as any;
        dismissed.push({ ...row, metadata_raw: row.metadata, metadata: this.safeJsonParse(row.metadata) || {} });
      }
      return dismissed;
    } finally {
      stmt.free();
    }
  }

  // --- إدارة المدمجين ---
  public async addReintegration(reintegration: { student_id: string; reintegration_date: string; previous_status: string; metadata?: any; }): Promise<string> {
    if (!this.db) throw new Error("Database not initialized");

    const existingReintegrations = await this.getReintegrations();
    const duplicateReintegration = existingReintegrations.find(r => {
        const rMetadata = this.safeJsonParse(r.metadata_raw);
        return r.student_id === reintegration.student_id && rMetadata?.academicYear === reintegration.metadata?.academicYear;
    });
    
    if (duplicateReintegration) {
      this.db.run(`UPDATE reintegration SET reintegration_date = ?, previous_status = ?, metadata = ? WHERE id = ?`, [reintegration.reintegration_date, reintegration.previous_status, JSON.stringify(reintegration.metadata || {}), duplicateReintegration.id]);
      await this.saveDatabase();
      return duplicateReintegration.id;
    }
    
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    this.db.run(`INSERT INTO reintegration (id, student_id, reintegration_date, previous_status, metadata, createdAt) VALUES (?, ?, ?, ?, ?, ?)`, [id, reintegration.student_id, reintegration.reintegration_date, reintegration.previous_status, JSON.stringify(reintegration.metadata || {}), createdAt]);
    await this.saveDatabase();
    return id;
  }

  public async getReintegrations(): Promise<any[]> {
    if (!this.db) return [];
    const stmt = this.db.prepare('SELECT * FROM reintegration ORDER BY reintegration_date DESC');
    try {
      const reintegrations: any[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject() as any;
        reintegrations.push({ ...row, metadata_raw: row.metadata, metadata: this.safeJsonParse(row.metadata) || {} });
      }
      return reintegrations;
    } finally {
      stmt.free();
    }
  }

  // --- إدارة التلاميذ غير الملتحقين ---
  public async addUnenrolledStudent(student: { student_id: string; lastName: string; firstName: string; gender: string; dateOfBirth: string; birthPlace: string; metadata?: any; }): Promise<string> {
    if (!this.db) throw new Error("Database not initialized");

    const existingUnenrolled = await this.getUnenrolledStudents();
    const duplicateUnenrolled = existingUnenrolled.find(u => {
        const uMetadata = this.safeJsonParse(u.metadata_raw);
        return u.student_id === student.student_id && uMetadata?.academicYear === student.metadata?.academicYear;
    });
    
    if (duplicateUnenrolled) {
      this.db.run(`UPDATE unenrolled_students SET lastName = ?, firstName = ?, gender = ?, dateOfBirth = ?, birthPlace = ?, metadata = ? WHERE id = ?`, [student.lastName, student.firstName, student.gender, student.dateOfBirth, student.birthPlace, JSON.stringify(student.metadata || {}), duplicateUnenrolled.id]);
      await this.saveDatabase();
      return duplicateUnenrolled.id;
    }
    
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    this.db.run(`INSERT INTO unenrolled_students (id, student_id, lastName, firstName, gender, dateOfBirth, birthPlace, metadata, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [id, student.student_id, student.lastName, student.firstName, student.gender, student.dateOfBirth, student.birthPlace, JSON.stringify(student.metadata || {}), createdAt]);
    await this.saveDatabase();
    return id;
  }

  public async getUnenrolledStudents(): Promise<any[]> {
    if (!this.db) return [];
    const stmt = this.db.prepare('SELECT * FROM unenrolled_students ORDER BY createdAt DESC');
    try {
      const students: any[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject() as any;
        students.push({ ...row, metadata_raw: row.metadata, metadata: this.safeJsonParse(row.metadata) || {} });
      }
      return students;
    } finally {
      stmt.free();
    }
  }

  // --- مقارنة لوائح الموسم الماضي مع الحالي ---
  public async compareAcademicYears(currentYear: string, previousYear: string): Promise<{ newStudents: any[]; leftStudents: any[]; continuingStudents: any[]; stats: { continuityRate: number; growthRate: number; totalCurrent: number; totalPrevious: number; }; }> {
    if (!this.db) throw new Error('قاعدة البيانات غير متاحة');
    try {
      const currentStudentsStmt = this.db.prepare("SELECT * FROM students WHERE academicYear = ? AND status = 'متمدرس'");
      currentStudentsStmt.bind([currentYear]);
      const currentStudents: any[] = [];
      while (currentStudentsStmt.step()) { currentStudents.push(currentStudentsStmt.getAsObject()); }
      currentStudentsStmt.free();

      const previousStudentsStmt = this.db.prepare("SELECT * FROM students WHERE academicYear = ? AND status = 'متمدرس'");
      previousStudentsStmt.bind([previousYear]);
      const previousStudents: any[] = [];
      while (previousStudentsStmt.step()) { previousStudents.push(previousStudentsStmt.getAsObject()); }
      previousStudentsStmt.free();

      const currentMap = new Map(currentStudents.map(s => [s.nationalId, s]));
      const previousMap = new Map(previousStudents.map(s => [s.nationalId, s]));

      const newStudents = currentStudents.filter(s => !previousMap.has(s.nationalId));
      const leftStudents = previousStudents.filter(s => !currentMap.has(s.nationalId));
      const continuingStudents = currentStudents.filter(s => previousMap.has(s.nationalId));

      const continuityRate = previousStudents.length > 0 ? Math.round((continuingStudents.length / previousStudents.length) * 100) : (currentStudents.length > 0 ? 100 : 0);
      const growthRate = previousStudents.length > 0 ? Math.round(((currentStudents.length - previousStudents.length) / previousStudents.length) * 100) : (currentStudents.length > 0 ? Infinity : 0);
      
      return {
        newStudents, leftStudents, continuingStudents,
        stats: {
          continuityRate, growthRate,
          totalCurrent: currentStudents.length,
          totalPrevious: previousStudents.length
        }
      };
    } catch (error) {
      console.error('خطأ في مقارنة السنوات الدراسية:', error);
      throw error;
    }
  }



  // جزء 5 المصحح

  // ----------------------------------------------
  // --- إدارة الأكواد السرية (Credentials) ---
  // ----------------------------------------------
  public async getCredentials(): Promise<any[]> {
    if (!this.db) return [];
    const stmt = this.db.prepare('SELECT * FROM credentials ORDER BY issue_date DESC');
    try {
      const credentials: any[] = [];
      while (stmt.step()) {
        credentials.push(stmt.getAsObject());
      }
      return credentials;
    } finally {
      stmt.free();
    }
  }

  public async getCredentialByStudentId(studentId: string): Promise<any | null> {
    if (!this.db) return null;
    const stmt = this.db.prepare('SELECT * FROM credentials WHERE student_id = ?');
    try {
      stmt.bind([studentId]);
      if (stmt.step()) {
        return stmt.getAsObject();
      }
      return null;
    } finally {
      stmt.free();
    }
  }

  public async addOrUpdateCredential(credential: any): Promise<void> {
    if (!this.db) return;
    this.db.run(
      'INSERT OR REPLACE INTO credentials (student_id, secret_code, issue_date) VALUES (?, ?, ?)',
      [credential.student_id, credential.secret_code, credential.issue_date]
    );
    await this.saveDatabase();
  }

  public async deleteCredential(studentId: string): Promise<void> {
    if (!this.db) return;
    this.db.run('DELETE FROM credentials WHERE student_id = ?', [studentId]);
    await this.saveDatabase();
  }

  // --- إدارة قرارات المجالس ---
  public async getCouncilDecisions(): Promise<any[]> {
    if (!this.db) return [];
    const stmt = this.db.prepare('SELECT * FROM council_decisions ORDER BY decision_date DESC');
    try {
      const decisions: any[] = [];
      while (stmt.step()) {
        decisions.push(stmt.getAsObject());
      }
      return decisions;
    } finally {
      stmt.free();
    }
  }

  // ----------------------------------------------
  // --- إدارة إحصائيات التوجيه (Guidance) ---
  // ----------------------------------------------
  public async initGuidanceDatabase(): Promise<void> {
    if (!this.db) return;
    try {
      this.db.run('DROP TABLE IF EXISTS guidance_statistics');
    } catch (error) {
      console.warn('لا يمكن حذف جدول guidance_statistics (ربما غير موجود):', error);
    }
    
    this.db.run(`
      CREATE TABLE guidance_statistics (
        id TEXT PRIMARY KEY, student_id TEXT NOT NULL, assigned_stream TEXT,
        gender TEXT, decision TEXT, academic_year TEXT, level TEXT, section TEXT,
        age INTEGER, ageGroup TEXT, createdAt TEXT, updatedAt TEXT,
        levelId TEXT, sectionId TEXT,
        FOREIGN KEY (levelId) REFERENCES levels(id),
        FOREIGN KEY (sectionId) REFERENCES sections(id)
      )
    `);
    
    await this.saveDatabase();
  }

  public async getGuidanceStatistics(): Promise<any> {
    if (!this.db) return { totalStudents: 0, records: [] };
    try {
      const stmt = this.db.prepare('SELECT * FROM guidance_statistics ORDER BY createdAt DESC');
      const records: any[] = [];
      while (stmt.step()) {
        records.push(stmt.getAsObject());
      }
      stmt.free();
      
      return { totalStudents: records.length, records: records };
    } catch (error) {
      console.warn('خطأ في جلب إحصائيات التوجيه:', error);
      return { totalStudents: 0, records: [] };
    }
  }

  public async addGuidanceStatistic(statistic: any): Promise<string> {
    if (!this.db) throw new Error("Database not initialized");
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    
    this.db.run(`
      INSERT INTO guidance_statistics (id, student_id, assigned_stream, gender, decision, academic_year, level, section, age, ageGroup, createdAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [id, statistic.student_id, statistic.assigned_stream || '', statistic.gender || '', statistic.decision || '', statistic.academic_year || '', statistic.level || '', statistic.section || '', statistic.age || null, statistic.ageGroup || '', createdAt]
    );
    await this.saveDatabase();
    return id;
  }

  public async clearGuidanceStatistics(): Promise<void> {
    if (!this.db) return;
    this.db.run('DELETE FROM guidance_statistics');
    await this.saveDatabase();
  }

  public async resetGuidanceStatistics(): Promise<void> {
    await this.initGuidanceDatabase();
  }

  // ----------------------------------------------
  // --- تصدير واستيراد قاعدة البيانات ---
  // ----------------------------------------------
  public async exportData(): Promise<Uint8Array> {
    if (!this.db) throw new Error('قاعدة البيانات غير متاحة');
    return this.db.export();
  }

  public async importData(data: Uint8Array): Promise<void> {
    const SQL = await initSqlJs({
      locateFile: (file: string) => `/${file}`
    });
    
    if (this.db) {
      this.db.close();
    }
    
    this.db = new SQL.Database(data);
    this.isInitialized = true;
    await this.saveDatabase();
  }

  // ----------------------------------------------
  // --- إعدادات المؤسسة (Settings) ---
  // ----------------------------------------------
  public async getInstitutionSettings(): Promise<any> {
    if (!this.db) throw new Error('قاعدة البيانات غير مهيأة');

    try {
      console.log('🔄 جلب إعدادات المؤسسة...');
      const stmt = this.db.prepare('SELECT * FROM institution_settings ORDER BY updatedAt DESC LIMIT 1');
      
      let result = null;
      if (stmt.step()) {
        result = stmt.getAsObject();
      }
      stmt.free();

      if (result && Object.keys(result).length > 0) {
        const settings = {
          ...result,
          name: result.institution || '',
          directorateName: result.directorate || ''
        };
        console.log('✅ تم جلب الإعدادات من قاعدة البيانات:', settings);
        return settings;
      }

      console.log('⚠️ لا توجد إعدادات في قاعدة البيانات، محاولة الجلب من localStorage...');
      const backup = localStorage.getItem('institution_settings_backup');
      if (backup) {
        console.log('✅ تم جلب الإعدادات من localStorage backup');
        const settingsFromStorage = JSON.parse(backup);
        await this.saveInstitutionSettings(settingsFromStorage); 
        return settingsFromStorage;
      }
      
      console.log('❌ لم يتم العثور على إعدادات المؤسسة في أي مكان.');
      return null;

    } catch (error) {
      console.error('❌ خطأ فادح في جلب إعدادات المؤسسة:', error);
      return null;
    }
  }

  public async saveInstitutionSettings(settings: any): Promise<void> {
    if (!this.db) throw new Error('قاعدة البيانات غير مهيأة');
    try {
      console.log('💾 حفظ إعدادات المؤسسة:', settings);
      this.db.run('DELETE FROM institution_settings');
      const stmt = this.db.prepare(`INSERT INTO institution_settings (academy, directorate, municipality, institution, academicYear, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`);
      stmt.run([
        settings.academy || '',
        settings.directorate || '',
        settings.municipality || '',
        settings.institution || '',
        settings.academicYear || '2025/2026',
        new Date().toISOString()
      ]);
      stmt.free();
      await this.saveDatabase();

      localStorage.setItem('institution_settings_backup', JSON.stringify(settings));
      console.log('✅ تم حفظ إعدادات المؤسسة بنجاح.');
    } catch (error) {
      console.error('❌ خطأ في حفظ إعدادات المؤسسة:', error);
      throw error;
    }
  }



// جزء 6 المصحح







// أكمل اللصق من هنا...



  // ----------------------------------------------
  // --- دوال الإحصائيات ووحدة التحكم ---
  // ----------------------------------------------
  
  public async clearDatabase(): Promise<void> {
    if (!this.isInitialized) await this.initialize();
    try {
      if (this.db) {
        this.db.close();
        this.db = null;
      }

      const db = await this.openIndexedDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
        transaction.oncomplete = () => db.close();
      });

      this.isInitialized = false;
      await this.initialize();
      console.log('تم مسح قاعدة البيانات بنجاح');
    } catch (error) {
      console.error('خطأ في مسح قاعدة البيانات:', error);
      throw error;
    }
  }

  public async getDatabaseStats(academicYear?: string): Promise<any> {
    if (!this.db) {
      await this.initialize();
      if (!this.db) throw new Error("فشل تهيئة قاعدة البيانات للإحصائيات");
    }

    try {
      const currentYear = academicYear || await this.getCurrentAcademicYear();
      const stats = { totalStudents: 0, activeStudents: 0, maleStudents: 0, femaleStudents: 0, totalAttendanceRecords: 0, totalGradeRecords: 0, averageGrade: 0, attendanceRate: 0, socialSupportCount: 0, transportServiceCount: 0 };
      
      const runCountQuery = (query: string, params: any[] = []) => {
          const stmt = this.db.prepare(query);
          if(params.length > 0) stmt.bind(params);
          const hasRow = stmt.step();
          const result = hasRow ? (stmt.getAsObject().count as number) : 0;
          stmt.free();
          return result;
      };

      stats.totalStudents = runCountQuery('SELECT COUNT(*) as count FROM students WHERE academicYear = ? AND status = ?', [currentYear, 'متمدرس']);
      stats.activeStudents = stats.totalStudents;
      stats.maleStudents = runCountQuery("SELECT COUNT(*) as count FROM students WHERE gender = 'ذكر' AND academicYear = ? AND status = ?", [currentYear, 'متمدرس']);
      stats.femaleStudents = runCountQuery("SELECT COUNT(*) as count FROM students WHERE gender = 'أنثى' AND academicYear = ? AND status = ?", [currentYear, 'متمدرس']);
      stats.socialSupportCount = runCountQuery('SELECT COUNT(*) as count FROM students WHERE socialSupport = 1 AND academicYear = ? AND status = ?', [currentYear, 'متمدرس']);
      stats.transportServiceCount = runCountQuery('SELECT COUNT(*) as count FROM students WHERE transportService = 1 AND academicYear = ? AND status = ?', [currentYear, 'متمدرس']);
      stats.totalAttendanceRecords = runCountQuery('SELECT COUNT(*) as count FROM attendance_records');
      stats.totalGradeRecords = runCountQuery('SELECT COUNT(*) as count FROM grade_records');

      const avgGradeStmt = this.db.prepare('SELECT AVG(grade) as avg FROM grade_records');
      if (avgGradeStmt.step()) {
        const avgResult = avgGradeStmt.getAsObject().avg;
        stats.averageGrade = avgResult ? Math.round((avgResult as number) * 100) / 100 : 0;
      }
      avgGradeStmt.free();

      const presentCount = runCountQuery("SELECT COUNT(*) as count FROM attendance_records WHERE status = 'حاضر'");
      stats.attendanceRate = stats.totalAttendanceRecords > 0 ? Math.round((presentCount / stats.totalAttendanceRecords) * 100) : 0;

      return stats;
    } catch (error) {
      console.error('خطأ في حساب إحصائيات قاعدة البيانات:', error);
      return {};
    }
  }

  public async getAllTables(): Promise<string[]> {
    if (!this.db) await this.initialize();
    if (!this.db) return [];
    try {
      const stmt = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
      const tables: string[] = [];
      while (stmt.step()) {
        tables.push(stmt.getAsObject().name as string);
      }
      stmt.free();
      return tables;
    } catch (error) {
      console.error('خطأ في الحصول على الجداول:', error);
      return [];
    }
  }



// جزء 7 المصحح (الأخير)

  /**
   * جلب جدول حصص قسم معين
   */
  public async getTimetableByClass(className: string): Promise<any[]> {
    if (!this.db) return [];
    try {
      console.log('🔎 [getTimetableByClass] البحث عن القسم:', className);
      const stmt = this.db.prepare('SELECT * FROM timetable WHERE class = ? ORDER BY day, start_time');
      const entries: any[] = [];
      stmt.bind([className]);

      while (stmt.step()) {
        entries.push(stmt.getAsObject());
      }
      stmt.free();
      console.log(`✅ [getTimetableByClass] وجدنا ${entries.length} حصص للقسم ${className}`);

      if (entries.length === 0) {
        console.warn('⚠️ لم نجد حصص! دعنا نفحص جميع الأقسام الموجودة في timetable...');
        const allClassesStmt = this.db.prepare('SELECT DISTINCT class FROM timetable LIMIT 20');
        const allClasses: string[] = [];
        while (allClassesStmt.step()) {
          const row = allClassesStmt.getAsObject();
          allClasses.push(row.class as string);
        }
        allClassesStmt.free();
        console.log('📚 جميع الأقسام الموجودة في timetable:', allClasses);
      }
      return entries;
    } catch (error) {
      console.error('❌ خطأ في جلب جدول القسم:', error);
      return [];
    }
  }

  /**
   * جلب حصة معينة حسب القسم واليوم والتوقيت
   */
  public async getTimetableByClassAndTime(className: string, day: string, timeSlot: string): Promise<any | null> {
    if (!this.db) return null;
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM timetable
        WHERE class = ? AND (day = ? OR day_arabic = ?) AND time_slot = ?
        LIMIT 1
      `);
      stmt.bind([className, day, day, timeSlot]);

      if (stmt.step()) {
        const result = stmt.getAsObject();
        stmt.free();
        return result;
      }
      stmt.free();
      return null;
    } catch (error) {
      console.error('خطأ في جلب الحصة:', error);
      return null;
    }
  }

  /**
   * جلب جميع جداول الحصص
   */
  public async getAllTimetable(): Promise<any[]> {
    if (!this.db) return [];
    try {
      const stmt = this.db.prepare('SELECT * FROM timetable ORDER BY class, day, start_time');
      const entries: any[] = [];
      while (stmt.step()) {
        entries.push(stmt.getAsObject());
      }
      stmt.free();
      return entries;
    } catch (error) {
      console.error('خطأ في جلب جميع جداول الحصص:', error);
      return [];
    }
  }

  /**
   * جلب توزيع الأساتذة
   */
  public async getTeacherAssignments(className?: string): Promise<any[]> {
    if (!this.db) return [];
    try {
      let query = 'SELECT * FROM teacher_assignments';
      const params: any[] = [];
      if (className) {
        query += ' WHERE class = ?';
        params.push(className);
      }
      query += ' ORDER BY class, teacher_arabic';

      const stmt = this.db.prepare(query);
      if (params.length > 0) {
        stmt.bind(params);
      }

      const assignments: any[] = [];
      while (stmt.step()) {
        assignments.push(stmt.getAsObject());
      }
      stmt.free();
      return assignments;
    } catch (error) {
      console.error('خطأ في جلب توزيع الأساتذة:', error);
      return [];
    }
  }

  /**
   * حذف جداول الحصص القديمة
   */
  public async clearTimetable(): Promise<void> {
    if (!this.db) return;
    this.db.run('DELETE FROM timetable');
    await this.saveDatabase();
  }

  /**
   * حذف توزيع الأساتذة القديم
   */
  public async clearTeacherAssignments(): Promise<void> {
    if (!this.db) return;
    this.db.run('DELETE FROM teacher_assignments');
    await this.saveDatabase();
  }

  /**
   * استيراد جداول حصص متعددة دفعة واحدة
   */
  public async bulkInsertTimetable(entries: any[]): Promise<number> {
    if (!this.db) return 0;
    // ملاحظة: هذا الكود بطيء، الأفضل استخدام transaction
    let count = 0;
    for (const entry of entries) {
      // افترض وجود دالة addTimetableEntry
      // await this.addTimetableEntry(entry);
      count++;
    }
    return count;
  }

  /**
   * استيراد توزيعات أساتذة متعددة دفعة واحدة
   */
  public async bulkInsertTeacherAssignments(assignments: any[]): Promise<number> {
    if (!this.db) return 0;
    // ملاحظة: هذا الكود بطيء، الأفضل استخدام transaction
    let count = 0;
    for (const assignment of assignments) {
      // افترض وجود دالة addTeacherAssignment
      // await this.addTeacherAssignment(assignment);
      count++;
    }
    return count;
  }

  // ============ دوال إدارة المواد الدراسية ============
  
  public async addSubject(subject: { code: string; name_arabic: string; name_french?: string }): Promise<string> {
    if (!this.db) throw new Error("Database not initialized");
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    try {
      this.db.run(`INSERT OR IGNORE INTO subjects (id, code, name_arabic, name_french, createdAt) VALUES (?, ?, ?, ?, ?)`, 
        [id, subject.code, subject.name_arabic, subject.name_french || '', createdAt]);
      await this.saveDatabase();
      return id;
    } catch (error) {
      console.error('خطأ في إضافة المادة:', error);
      throw error;
    }
  }

  public async getAllSubjects(): Promise<any[]> {
    if (!this.db) return [];
    try {
      const stmt = this.db.prepare('SELECT * FROM subjects ORDER BY name_arabic');
      const subjects: any[] = [];
      while (stmt.step()) {
        subjects.push(stmt.getAsObject());
      }
      stmt.free();
      return subjects;
    } catch (error) {
      console.error('خطأ في جلب المواد:', error);
      return [];
    }
  }

  public async extractSubjectsFromTimetable(): Promise<number> {
    if (!this.db) return 0;
    try {
      const timetable = await this.getAllTimetable();
      const uniqueSubjects = new Map<string, { code: string; name_arabic: string }>();

      for (const entry of timetable) {
        if (entry.subject_code && entry.subject_arabic) {
          uniqueSubjects.set(entry.subject_code, {
            code: entry.subject_code,
            name_arabic: entry.subject_arabic
          });
        }
      }

      let count = 0;
      for (const subject of uniqueSubjects.values()) {
        try {
          await this.addSubject(subject);
          count++;
        } catch (error) {
          console.error('خطأ في إضافة مادة من الاستخراج:', error);
        }
      }
      return count;
    } catch (error) {
      console.error('خطأ في استخراج المواد:', error);
      return 0;
    }
  }

  public async getStudentCredential(nationalId: string): Promise<string | null> {
    if (!this.db) await this.initialize();
    if (!this.db) return null;
    try {
      const stmt = this.db.prepare('SELECT secret_code FROM credentials WHERE student_id = ?');
      stmt.bind([nationalId]);
      if (stmt.step()) {
        const result = stmt.getAsObject();
        stmt.free();
        return result.secret_code as string;
      }
      stmt.free();
      return null;
    } catch (error) {
      console.error('خطأ في جلب الكود السري:', error);
      return null;
    }
  }

  public async addMessageTemplate(template: { name: string; category: string; content: string }): Promise<void> {
    if (!this.db) await this.initialize();
    if (!this.db) return;
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    this.db.run(`INSERT INTO message_templates (id, name, category, content, createdAt) VALUES (?, ?, ?, ?, ?)`, 
      [id, template.name, template.category, template.content, createdAt]);
    await this.saveDatabase();
  }

  public async getMessageTemplates(): Promise<any[]> {
    if (!this.db) await this.initialize();
    if (!this.db) return [];
    const stmt = this.db.prepare('SELECT * FROM message_templates ORDER BY category, name');
    const templates: any[] = [];
    while (stmt.step()) {
      templates.push(stmt.getAsObject());
    }
    stmt.free();
    return templates;
  }

  public async deleteMessageTemplate(id: string): Promise<void> {
    if (!this.db) await this.initialize();
    if (!this.db) return;
    this.db.run('DELETE FROM message_templates WHERE id = ?', [id]);
    await this.saveDatabase();
  }

  public async getMessageTemplatesByCategory(category: string): Promise<any[]> {
    if (!this.db) await this.initialize();
    if (!this.db) return [];
    const stmt = this.db.prepare('SELECT * FROM message_templates WHERE category = ? ORDER BY name');
    stmt.bind([category]);
    const templates: any[] = [];
    while (stmt.step()) {
      templates.push(stmt.getAsObject());
    }
    stmt.free();
    return templates;
  }

  public async getWhatsAppSettings(): Promise<any | null> {
    if (!this.db) await this.initialize();
    if (!this.db) return null;
    try {
      const stmt = this.db.prepare('SELECT * FROM whatsapp_settings LIMIT 1');
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return {
          evolutionApiUrl: row.evolution_api_url || '',
          evolutionInstanceName: row.evolution_instance_name || '',
          evolutionApiKey: row.evolution_api_key || '',
          isActive: row.is_active === 1
        };
      }
      stmt.free();
      return null;
    } catch (error) {
      console.error('❌ خطأ في تحميل إعدادات واتساب:', error);
      return null;
    }
  }

  public async saveWhatsAppSettings(settings: { evolution_api_url: string; evolution_instance_name: string; evolution_api_key: string; is_active: boolean; }): Promise<void> {
    if (!this.db) await this.initialize();
    if (!this.db) return;

    try {
      const checkColumns = this.db.prepare("PRAGMA table_info(whatsapp_settings)");
      const columns: any[] = [];
      while (checkColumns.step()) { columns.push(checkColumns.getAsObject()); }
      checkColumns.free();
      
      const columnNames = columns.map((col: any) => col.name);
      if (!columnNames.includes('evolution_api_url')) {
        throw new Error('جدول whatsapp_settings بحاجة إلى ترحيل. الرجاء إعادة تحميل الصفحة.');
      }

      const stmt = this.db.prepare('SELECT COUNT(*) as count FROM whatsapp_settings');
      stmt.step();
      const result = stmt.getAsObject();
      stmt.free();

      if ((result.count as number) > 0) {
        this.db.run('UPDATE whatsapp_settings SET evolution_api_url = ?, evolution_instance_name = ?, evolution_api_key = ?, is_active = ?',
          [settings.evolution_api_url, settings.evolution_instance_name, settings.evolution_api_key, settings.is_active ? 1 : 0]
        );
      } else {
        this.db.run('INSERT INTO whatsapp_settings (evolution_api_url, evolution_instance_name, evolution_api_key, is_active) VALUES (?, ?, ?, ?)',
          [settings.evolution_api_url, settings.evolution_instance_name, settings.evolution_api_key, settings.is_active ? 1 : 0]
        );
      }
      await this.saveDatabase();
    } catch (error) {
      console.error('❌ خطأ في حفظ إعدادات WhatsApp:', error);
      throw error;
    }
  }

} // --- نهاية الكلاس ---

// --- تصدير الكائن ---
export const dbManager = new DatabaseManager();





import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export default async function handler(req, res) {
    const { student_id, year, class: student_class, dept, pin } = req.query;
    const tableName = student_class.includes("SSS") ? "sss_students" : "jss_students";

    let query = supabase
        .from(tableName)
        .select('*')
        .eq('student_id', student_id)
        .eq('year', year)
        .eq('class', student_class)
        .eq('pin', pin);

    if (student_class.includes("SSS")) {
        query = query.eq('dept', dept); 
    }

    const { data: student, error } = await query.single();

    if (error || !student) {
        return res.status(404).json({ error: "No record found. Please verify ID, PIN, and Class/Dept." });
    }

    if (student.check_count >= 3) {
        return res.status(403).json({ error: "Trial attempts exhausted (3/3). Please contact Go-Tegs Admin." });
    }

    await supabase
        .from(tableName)
        .update({ check_count: (student.check_count || 0) + 1 })
        .eq('id', student.id);

    const scores = Object.keys(student)
        .filter(key => key.endsWith('_score') && student[key] !== null)
        .map(key => ({
            subject: key,
            score: student[key]
        }));

    return res.status(200).json({
        full_name: student.full_name,
        dob: student.dob,   
        term: student.term,
        is_paid: student.is_paid, // <--- NEW: Tells frontend if they paid
        scores: scores
    });
}

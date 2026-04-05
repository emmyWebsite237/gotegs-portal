import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export default async function handler(req, res) {
    const { student_id, year, student_class, pin } = req.query;

    const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('student_id', student_id)
        .eq('year', year)
        .eq('class', student_class)
        .eq('pin', pin)
        .single();

    if (error || !student) return res.status(404).json({ error: "Invalid Credentials!" });
    if (student.check_count >= 3) return res.status(403).json({ error: "Trial exhausted!" });

    // Update check count
    await supabase.from('students').update({ check_count: student.check_count + 1 }).eq('id', student.id);

    // Send back the scores
    return res.status(200).json({
        name: student.full_name,
        scores: [
            { subject: "Mathematics", score: student.maths_score },
            { subject: "English", score: student.english_score },
            { subject: "Science", score: student.science_score }
        ]
    });
}

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export default async function handler(req, res) {
    const { student_id, year, student_class } = req.query;

    // Search database for ID + Year + Class
    const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('student_id', student_id)
        .eq('year', year)
        .eq('class', student_class)
        .single();

    if (error || !student) {
        return res.status(404).json({ error: "Result not found for this Year/Class!" });
    }

    // Check if trials are used up
    if (student.check_count >= 3) {
        return res.status(403).json({ error: "Trial exhausted. See Admin." });
    }

    // Increase the count in Supabase
    await supabase
        .from('students')
        .update({ check_count: student.check_count + 1 })
        .eq('id', student.id); 

    return res.status(200).json({ result_url: student.result_url });
}

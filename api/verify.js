import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export default async function handler(req, res) {
    // 1. Capture data from the frontend
    const { student_id, year, class: student_class, dept, pin } = req.query;

    // 2. Route to the correct table (JSS vs SSS)
    const tableName = student_class.includes("SSS") ? "sss_students" : "jss_students";

    // 3. Build the Database Query
    let query = supabase
        .from(tableName)
        .select('*')
        .eq('student_id', student_id)
        .eq('year', year)
        .eq('class', student_class)
        .eq('pin', pin);

    // If SSS, ensure we filter by their specific department (Science, Art, etc.)
    if (student_class.includes("SSS")) {
        query = query.eq('dept', dept); 
    }

    const { data: student, error } = await query.single();

    // 4. Validation Layer
    if (error || !student) {
        return res.status(404).json({ error: "No record found. Please verify ID, PIN, and Class/Dept." });
    }

    // The "3-Trial" Logic
    if (student.check_count >= 3) {
        return res.status(403).json({ error: "Trial attempts exhausted (3/3). Please contact Go-Tegs Admin." });
    }

    // 5. Update Trial Count (+1)
    await supabase
        .from(tableName)
        .update({ check_count: (student.check_count || 0) + 1 })
        .eq('id', student.id);

    // 6. Filter Subjects (Only grab columns that have scores and aren't empty)
    const scores = Object.keys(student)
        .filter(key => key.endsWith('_score') && student[key] !== null)
        .map(key => ({
            subject: key,
            score: student[key]
        }));

    // 7. Send data back to the Report Card
    return res.status(200).json({
        full_name: student.full_name,
        dob: student.dob,   // Fetches DOB for the header
        term: student.term, // Fetches Term for the header
        scores: scores
    });
}

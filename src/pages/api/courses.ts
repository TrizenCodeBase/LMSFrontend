import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();

    console.log('Fetching courses from database...');
    
    const courses = await db.collection('courses')
      .find({})
      .project({
        _id: 1,
        title: 1,
        courseUrl: 1
      })
      .toArray();

    console.log('Raw courses from DB:', courses);

    // Transform the _id to string format and ensure proper structure
    const formattedCourses = courses.map(course => {
      const formatted = {
        courseId: course._id.toString(),
        title: course.title,
        courseUrl: course.courseUrl
      };
      console.log('Formatted course:', formatted);
      return formatted;
    });

    console.log('Sending formatted courses:', formattedCourses);
    return res.status(200).json(formattedCourses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return res.status(500).json({ message: 'Error fetching courses' });
  }
} 
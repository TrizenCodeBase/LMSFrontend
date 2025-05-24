import axios from '../lib/axios';

export interface Note {
  _id: string;
  userId: string;
  courseId: string;
  dayNumber: number;
  content: string;
  updatedAt: Date;
  createdAt: Date;
}

export const saveNote = async (note: Omit<Note, '_id' | 'updatedAt' | 'createdAt'>, token: string): Promise<Note> => {
  try {
    console.log('Saving note:', note);
    const response = await axios.post<Note>('/api/notes', {
      courseId: note.courseId,
      dayNumber: note.dayNumber,
      content: note.content
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Note saved successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error saving note:', error);
    throw error;
  }
};

export const getNotes = async (courseId: string, token: string): Promise<Note[]> => {
  try {
    console.log('Fetching notes for course:', courseId);
    const response = await axios.get<Note[]>(`/api/notes/${courseId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Notes fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }
};

export const updateNote = async (noteId: string, content: string, token: string): Promise<Note> => {
  try {
    console.log('Updating note:', { noteId, content });
    const response = await axios.put<Note>(`/api/notes/${noteId}`, { content }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Note updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
}; 
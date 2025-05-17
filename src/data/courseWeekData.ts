
export interface Lecture {
  id: string;
  title: string;
  type: 'video' | 'reading' | 'quiz';
  duration: string;
  completed: boolean;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  lectures: Lecture[];
  videosLeft: number;
  readingsLeft: number;
  assessmentsLeft: number;
  expanded: boolean;
}

export interface WeekData {
  id: string;
  title: string;
  modules: Module[];
  completed: boolean;
}

const courseWeekData: Record<string, WeekData> = {
  week1: {
    id: 'week1',
    title: 'Week 1: Introduction to Natural Language Processing',
    modules: [
      {
        id: 'sentiment-analysis',
        title: 'Sentiment Analysis with Logistic Regression',
        description: 'Learn the fundamentals of sentiment analysis and how to implement it using logistic regression techniques.',
        lectures: [
          {
            id: 'lecture1',
            title: 'Introduction to Sentiment Analysis',
            type: 'video',
            duration: '8 min',
            completed: false,
          },
          {
            id: 'lecture2',
            title: 'Logistic Regression Basics',
            type: 'video',
            duration: '12 min',
            completed: false,
          },
          {
            id: 'lecture3',
            title: 'Feature Extraction for Text',
            type: 'reading',
            duration: '15 min',
            completed: false,
          },
          {
            id: 'lecture4',
            title: 'Implementing Sentiment Analysis',
            type: 'video',
            duration: '18 min',
            completed: false,
          },
          {
            id: 'lecture5',
            title: 'Week 1 Quiz',
            type: 'quiz',
            duration: '20 min',
            completed: false,
          }
        ],
        videosLeft: 38,
        readingsLeft: 15,
        assessmentsLeft: 1,
        expanded: true
      }
    ],
    completed: false
  },
  week2: {
    id: 'week2',
    title: 'Week 2: Vector Space Models',
    modules: [
      {
        id: 'vector-spaces',
        title: 'Word Vectors and Vector Space Models',
        description: 'Understand how to represent words as vectors and build models based on vector spaces.',
        lectures: [
          {
            id: 'lecture1',
            title: 'Word Embeddings',
            type: 'video',
            duration: '15 min',
            completed: false,
          },
          {
            id: 'lecture2',
            title: 'Word2Vec Algorithm',
            type: 'video',
            duration: '20 min',
            completed: false,
          },
          {
            id: 'lecture3',
            title: 'Working with Pretrained Embeddings',
            type: 'reading',
            duration: '25 min',
            completed: false,
          },
          {
            id: 'lecture4',
            title: 'Week 2 Programming Assignment',
            type: 'quiz',
            duration: '60 min',
            completed: false,
          }
        ],
        videosLeft: 35,
        readingsLeft: 25,
        assessmentsLeft: 1,
        expanded: true
      }
    ],
    completed: false
  },
  week3: {
    id: 'week3',
    title: 'Week 3: Sequence Models',
    modules: [
      {
        id: 'sequence-models',
        title: 'Part-of-Speech Tagging and Named Entity Recognition',
        description: 'Learn about sequence models and their applications in NLP tasks like POS tagging and NER.',
        lectures: [
          {
            id: 'lecture1',
            title: 'Introduction to Sequence Models',
            type: 'video',
            duration: '10 min',
            completed: false,
          },
          {
            id: 'lecture2',
            title: 'Hidden Markov Models',
            type: 'video',
            duration: '22 min',
            completed: false,
          },
          {
            id: 'lecture3',
            title: 'Viterbi Algorithm',
            type: 'reading',
            duration: '18 min',
            completed: false,
          },
          {
            id: 'lecture4',
            title: 'Named Entity Recognition',
            type: 'video',
            duration: '15 min',
            completed: false,
          },
          {
            id: 'lecture5',
            title: 'Week 3 Quiz',
            type: 'quiz',
            duration: '30 min',
            completed: false,
          }
        ],
        videosLeft: 47,
        readingsLeft: 18,
        assessmentsLeft: 1,
        expanded: true
      }
    ],
    completed: false
  },
  week4: {
    id: 'week4',
    title: 'Week 4: Machine Translation and Attention',
    modules: [
      {
        id: 'machine-translation',
        title: 'Machine Translation and Document Search',
        description: 'Explore machine translation techniques and methods for efficient document search.',
        lectures: [
          {
            id: 'lecture1',
            title: 'Statistical Machine Translation',
            type: 'video',
            duration: '14 min',
            completed: false,
          },
          {
            id: 'lecture2',
            title: 'Neural Machine Translation',
            type: 'video',
            duration: '18 min',
            completed: false,
          },
          {
            id: 'lecture3',
            title: 'Attention Mechanism',
            type: 'reading',
            duration: '20 min',
            completed: false,
          },
          {
            id: 'lecture4',
            title: 'Document Search Techniques',
            type: 'video',
            duration: '16 min',
            completed: false,
          },
          {
            id: 'lecture5',
            title: 'Final Project',
            type: 'quiz',
            duration: '120 min',
            completed: false,
          }
        ],
        videosLeft: 48,
        readingsLeft: 20,
        assessmentsLeft: 1,
        expanded: true
      }
    ],
    completed: false
  },
};

export default courseWeekData;

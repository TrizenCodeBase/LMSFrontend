import { MongoClient, ObjectId } from 'mongodb';

async function analyzeQuizSubmissions() {
    const uri = "mongodb+srv://user:user@cluster0.jofrcro.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
    const client = new MongoClient(uri);

    try {
        console.log('Attempting to connect to MongoDB...');
        await client.connect();
        console.log('Successfully connected to MongoDB');

        const db = client.db('test'); // Adjust database name if different
        console.log('Using database:', db.databaseName);

        // First, let's check what collections exist
        const collections = await db.listCollections().toArray();
        console.log('\nAvailable collections:', collections.map(c => c.name));

        // Check if quizsubmissions collection exists
        if (!collections.find(c => c.name === 'quizsubmissions')) {
            console.log('WARNING: quizsubmissions collection not found!');
            return;
        }

        // Fetch all quiz submissions
        console.log('\nFetching quiz submissions...');
        const quizSubmissions = await db.collection('quizsubmissions').find({}).toArray();
        console.log(`Total quiz submissions found: ${quizSubmissions.length}`);

        if (quizSubmissions.length === 0) {
            console.log('No quiz submissions found in the database!');
            // Let's check a sample document to see the structure
            const sampleDoc = await db.collection('quizsubmissions').findOne({});
            if (sampleDoc) {
                console.log('Sample document structure:', JSON.stringify(sampleDoc, null, 2));
            }
            return;
        }

        // Log sample submission to see structure
        console.log('\nSample quiz submission:', JSON.stringify(quizSubmissions[0], null, 2));

        // Group submissions by userId
        const submissionsByUser = {};
        quizSubmissions.forEach(submission => {
            const userId = submission.userId?.toString();
            if (!userId) {
                console.log('WARNING: Found submission without userId:', JSON.stringify(submission, null, 2));
                return;
            }
            if (!submissionsByUser[userId]) {
                submissionsByUser[userId] = [];
            }
            submissionsByUser[userId].push(submission);
        });

        console.log(`\nNumber of users with quiz submissions: ${Object.keys(submissionsByUser).length}`);

        // Analyze submissions for each user
        for (const userId in submissionsByUser) {
            const userSubmissions = submissionsByUser[userId];
            
            // Get user details
            let user;
            try {
                user = await db.collection('users').findOne({ 
                    $or: [
                        { _id: new ObjectId(userId) },
                        { _id: userId },
                        { userId: userId }
                    ]
                });
                if (!user) {
                    console.log(`WARNING: Could not find user with ID ${userId} in users collection`);
                }
            } catch (error) {
                console.log(`Error finding user ${userId}:`, error.message);
            }
            
            const userName = user ? user.name : 'Unknown User';

            console.log(`\n\nAnalyzing submissions for user: ${userName} (${userId})`);
            console.log('----------------------------------------');
            console.log(`Total submissions: ${userSubmissions.length}`);

            // Group by courseUrl
            const submissionsByCourse = {};
            userSubmissions.forEach(submission => {
                const courseUrl = submission.courseUrl || 'unknown-course';
                if (!submissionsByCourse[courseUrl]) {
                    submissionsByCourse[courseUrl] = [];
                }
                submissionsByCourse[courseUrl].push(submission);
            });

            // Analyze each course's submissions
            for (const courseUrl in submissionsByCourse) {
                const courseSubmissions = submissionsByCourse[courseUrl];
                console.log(`\nCourse: ${courseUrl}`);
                console.log(`Number of submissions: ${courseSubmissions.length}`);

                // Calculate average score
                const totalScore = courseSubmissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
                const avgScore = totalScore / courseSubmissions.length;

                console.log(`Total score: ${totalScore}`);
                console.log(`Average score: ${avgScore.toFixed(2)}`);
                
                // Check for potential issues
                const missingScores = courseSubmissions.filter(sub => sub.score === undefined || sub.score === null).length;
                const completedSubmissions = courseSubmissions.filter(sub => sub.isCompleted).length;
                const zeroScores = courseSubmissions.filter(sub => sub.score === 0).length;
                
                if (missingScores > 0) {
                    console.log(`WARNING: ${missingScores} submissions have missing scores`);
                }
                if (zeroScores > 0) {
                    console.log(`WARNING: ${zeroScores} submissions have zero scores`);
                }
                console.log(`Completed submissions: ${completedSubmissions}/${courseSubmissions.length}`);

                // Show detailed submission info
                console.log('\nSubmission details:');
                courseSubmissions.forEach((sub, index) => {
                    console.log(`${index + 1}. Score: ${sub.score}, Completed: ${sub.isCompleted}, Date: ${sub.submittedDate}, ID: ${sub._id}`);
                });
            }
        }

    } catch (error) {
        console.error('Error analyzing quiz submissions:', error);
    } finally {
        await client.close();
        console.log('\nClosed MongoDB connection');
    }
}

// Run the analysis
console.log('Starting quiz submission analysis...');
analyzeQuizSubmissions()
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    }); 
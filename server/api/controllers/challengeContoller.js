const Challenge = require('../models/challenge.model'); 
const CommentModel = require('../models/comment.model'); 

// Create a new Challenge
exports.createChallenge = async (req, res) => {
  try {
    const userId = req.user.id; // Get the user ID from the request

    // Create a new challenge with the request body and set the author field
    const challenge = new Challenge({
      ...req.body,
      author: userId, // Set the author to the logged-in user's ID
      comments: req.body.comments ? req.body.comments : [] // Handle comments
    });

    await challenge.save();
    res.status(201).json({ message: "Challenge created", challenge });
  } catch (error) {
    res.status(400).json({ message: "Error creating challenge", error });
  }
};
// List all Challenges with Filters
exports.listChallenges = async (req, res) => {
    try {
      const query = {};
      
      console.log("Incoming query: ", req.query); 
      
      // Handle multiple complexities
      if (Array.isArray(req.query.complexity)) {
        query.complexity = { $in: req.query.complexity.map(item => item.trim()) };
      } else if (req.query.complexity) {
        query.complexity = req.query.complexity.trim();
      }
      
      // Handle multiple tags
      if (Array.isArray(req.query.tag)) {
        query.tags = { $in: req.query.tag.map(item => item.trim()) };
      } else if (req.query.tag) {
        query.tags = req.query.tag.trim();
      }
  
      console.log("Final MongoDB query: ", query); 
      
      let challenges = await Challenge.find(query)
      .populate('author', 'name'); // Populate author field with name

    // Handling cases where the author might have been deleted
    challenges = challenges.map(challenge => {
      if (!challenge.author) {
        challenge = { ...challenge.toObject(), author: { name: "User Deleted" } };
      }
      return challenge;
    });
      res.status(200).json({ challenges });
    } catch (error) {
      res.status(400).json({ message: "Error fetching challenges", error });
    }
  };
  
  

// Get Challenge by ID
exports.getChallengeById = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .populate('author', 'name') // Populate the challenge's author
      .populate('comments.author', 'name')
      .populate('likes', 'name')
      .populate({
        path: 'comments', // Populate the comments
        model: 'Comment', // Ensure this is the correct model name for your comments
        populate: {
          path: 'author',
          model: 'UserData', // Ensure this is the correct model name for your users
          select: 'name' // Select only the name field of the author
        }
      });

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    res.status(200).json({ challenge });
  } catch (error) {
    res.status(400).json({ message: "Error fetching challenge", error });
  }
};


// Update Challenge by ID
exports.updateChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ message: "Challenge updated", challenge });
  } catch (error) {
    res.status(400).json({ message: "Error updating challenge", error });
  }
};

// Delete Challenge by ID
exports.deleteChallenge = async (req, res) => {
  try {
    await Challenge.findByIdAndRemove(req.params.id);
    res.status(200).json({ message: "Challenge deleted" });
  } catch (error) {
    res.status(400).json({ message: "Error deleting challenge", error });
  }
};

exports.getChallengesByTag = async (req, res) => {
    try {
      const tag = req.params.tag;
      const challenges = await Challenge.find({ tags: tag });
      res.status(200).json({ challenges });
    } catch (error) {
      res.status(400).json({ message: "Error fetching challenges by tag", error });
    }
  };
  
  // Get Challenges by Author
  exports.getChallengesByAuthor = async (req, res) => {
    try {
      const authorId = new mongoose.Types.ObjectId(req.params.authorId);
      const challenges = await Challenge.find({ author: authorId });
      res.status(200).json({ challenges });
    } catch (error) {
      res.status(400).json({ message: "Error fetching challenges by author", error });
    }
  };
  
  // Get Challenges by Complexity
  exports.getChallengesByComplexity = async (req, res) => {
    try {
      const complexity = req.params.complexity;
      const challenges = await Challenge.find({ complexity });
      res.status(200).json({ challenges });
    } catch (error) {
      res.status(400).json({ message: "Error fetching challenges by complexity", error });
    }
  };

  // Add a comment to a Challenge
  exports.addCommentToChallenge = async (req, res) => {
    try {
      const challengeId = req.params.challengeId;
      const userId = req.user.id;
  

      console.log("first here");
      // Create a new Comment document
      const newComment = new CommentModel({
        text: req.body.text,
        author: userId
      });

      console.log(newComment);
  
      // Save the comment
      const savedComment = await newComment.save();

      console.log("reached here");
  
      // Find the challenge and update its comments array
      const challenge = await Challenge.findById(challengeId);
      console.log(challenge);
      console.log("also here");
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      console.log("also also  here");
      // Add the comment's ID to the challenge's comments array
      challenge.comments.push(savedComment._id);
  
      // Save the updated challenge
      await challenge.save();
  
      res.status(200).json({ message: "Comment added", challenge });
    } catch (error) {
      res.status(400).json({ message: "Error adding comment", error });
    }
  };

  // Add a like to a challenge
exports.likeChallenge = async (req, res) => {
  try {
    const challengeId = req.params.challengeId;
    console.log(challengeId);
    const userId = req.user.id; // Assuming you have the user's ID from the token
    console.log(userId);


    const challenge = await Challenge.findById(challengeId);
    console.log(challenge);

    if (!challenge.likes.includes(userId)) {
      challenge.likes.push(userId);
      await challenge.save();
    }

    res.status(200).json({ message: "Challenge liked" });
  } catch (error) {
    res.status(400).json({ message: "Error liking challenge", error });
  }
};

// In your challenge controller
exports.unlikeChallenge = async (req, res) => {
  const challengeId = req.params.id;
  const userId = req.user.id; // Extract user ID from the token

  await Challenge.findByIdAndUpdate(challengeId, {
    $pull: { likes: userId }
  });

  res.status(200).json({ message: "Challenge unliked" });
};

// In your challenge controller
exports.toggleLikeChallenge = async (req, res) => {
  const challengeId = req.params.id;
  const userId = req.user.id; // Extract user ID from the token

  try {
    const challenge = await Challenge.findById(challengeId);

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    const likeIndex = challenge.likes.indexOf(userId);
    if (likeIndex > -1) {
      challenge.likes.splice(likeIndex, 1); // User has liked, so unlike
    } else {
      challenge.likes.push(userId); // User hasn't liked, so like
    }

    await challenge.save();
    res.status(200).json({ message: "Challenge like toggled" });
  } catch (error) {
    res.status(400).json({ message: "Error toggling challenge like", error });
  }
};



  

import React, { useState, useEffect, useContext, Fragment } from 'react';
import { useParams } from 'react-router-dom';
import ChallengeService from '../../Services/ChallengesServices';
import UserContext from '../../UserContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Challenge.css';
import { CircularProgress, Tooltip, Box, Chip } from '@mui/material';
import { Link } from 'react-router-dom';


const ChallengeDetailPage = () => {
  const { challengeId } = useParams();
  const [challenge, setChallenge] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(UserContext);

  useEffect(() => {
    const fetchChallengeDetail = async () => {
      try {
        setIsLoading(true);
        const response = await ChallengeService.getChallengeById(challengeId, user.token);
        setChallenge(response.data.challenge);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && user.token) {
      fetchChallengeDetail();
    }
  }, [challengeId, user]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await ChallengeService.createComment(challengeId, { text: newComment }, user.token);
      setNewComment('');
      setIsLoading(true);
      const response = await ChallengeService.getChallengeById(challengeId, user.token);
      setChallenge(response.data.challenge);
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLike = async () => {
    try {
      await ChallengeService.toggleLikeChallenge(challengeId, user.token);
      setIsLoading(true);
      const response = await ChallengeService.getChallengeById(challengeId, user.token);
      setChallenge(response.data.challenge);
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const getLikesTooltip = (likes) => {
    return likes.map(user => <Box key={user._id}>{user.name}</Box>);
  };

  if (!user || !user.token) {
    return <div className="container mt-3">Please log in to view challenge details.</div>;
  }

  if (isLoading) {
    return <CircularProgress />;
  }

  if (error) {
    return <div className="alert alert-danger container mt-3">Error: {error}</div>;
  }

  if (!challenge) {
    return <div className="container mt-3">No challenge found.</div>;
  }

  return (
    <div className="container mt-5" style={{ maxWidth: '800px' }}>
      {challenge.picture && (
        <img src={challenge.picture} alt={challenge.title} className="img-fluid mb-3" />
      )}

      <div className="card mb-4">
        <div className="card-body text-center">
          <h1 className="card-title display-4">{challenge.title}</h1>
          <p className="card-text">{challenge.description}</p>
          <p className="card-text text-muted">
            <small>Created: {new Date(challenge.createdAt).toLocaleString()}</small> | 
            <small> Updated: {new Date(challenge.updatedAt).toLocaleString()}</small>
          </p>
          <p className="card-text">
            <strong>Author:  </strong> 
            <Link to={`/profile/${challenge.author._id}`} className="text-primary">
              {challenge.author.name}
            </Link>
          </p>
          <Box sx={{ my: 2, display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
            {challenge.tags.map((tag, index) => (
              <Chip key={index} label={tag} variant="outlined" sx={{ m: 0.5 }} />
            ))}
          </Box>        
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <button className="btn btn-primary" onClick={handleLike}>Like</button>
        <Tooltip 
          title={<Fragment>{getLikesTooltip(challenge.likes)}</Fragment>}
          placement="top"
        >
          <span className="badge bg-secondary">Likes: {challenge.likes.length}</span>
        </Tooltip>
      </div>

      <h2>Comments</h2>
      {challenge.comments && challenge.comments.map((comment, index) => (
        <div key={index} className="mb-3 p-2 border rounded">
          <strong>{comment.author ? comment.author.name : 'Unknown Author'}:</strong>
          <p>{comment.text}</p>
        </div>
      ))}

      <form onSubmit={handleCommentSubmit} className="mb-3">
        <textarea
          className="form-control"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          rows="3"
        />
        <button type="submit" className="btn btn-success mt-2">Add Comment</button>
      </form>
    </div>
  );
};

export default ChallengeDetailPage;

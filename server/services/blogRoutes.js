const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorization = require('../middleware/authorization');
const blogService = require('../services/blogService');
const { startRun, resumeRun } = require('../services/blogGraph');

// Create a new blog    
router.use(authenticate, authorization('admin'));

router.post('/generate', async (req, res) => {
    try {
        const { topic } = req.body;
        if(!topic) {
            return res.status(400).json({ message: 'Topic is required' });
        }
        const { blogId, threadId } = await blogService.createBlog({ topic, createdBy: req.user.id });
        await startRun(threadId, {  topic, blogId});
        const blog = await blogService.getById(blogId);
        res.status(201).json(blog);

    }catch (error) {
        console.error('Error in  /blog/generate:', error);
        res.status(500).json({ error:'Failed to generate blog' });
    }
});


router.post('/:id/decision', async (req, res) => {
    try {
        const { action,feedback } = req.body;
        if(action !== 'approve' && action !== 'reject') {
            return res.status(400).json({ message: ' action must be either "approve" or "reject"' });
        }
        const blog =await blogService.getById(req.params.id);
        if(!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        await resumeRun(blog.threadId, {  action, feedback });

        const updated = await blogService.getById(req.params.id);
        res.json(updated);
    }catch (error) {
        console.error('Error in /blog/:id/decision:', error);
        res.status(500).json({ error:'Failed to submit decision' });
    }
});

router.get('/', async (req, res) => {
    try {
        const blog =await blogService.getById(req.params.id);
        if(!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        res.json(blog);
    }catch (error) {
        console.error('Error in /blog/:id:', error);
        res.status(500).json({ error:'Failed to fetch blog' });
    }
});


router.get('/list', async (req, res) => {
    try {
        const blogs = await blogService.listByStatus(req.query.status);
        res.json(blogs);
    }catch (error) {
        console.error('Error in GET /blog:', error);
        res.status(500).json({ error:'Failed to list blogs' });
    }
});

module.exports = router;

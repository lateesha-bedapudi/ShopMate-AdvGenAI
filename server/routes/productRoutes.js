const express = require('express');
const multer = require('multer');
const router = express.Router();

const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    generateDescription,
    generateDetailsFromImage,
    semanticSearch
} = require('../controllers/productController');

const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorization');

// Public Routes
router.get('/search/semantic', semanticSearch);

router.route('/')
    .get(getProducts); // Public access

router.route('/:id')
    .get(getProductById); // Public access

// Admin Only Routes
router.post(
    '/',
    authenticate,
    authorizeRoles('admin'),
    createProduct
);

router.put(
    '/:id',
    authenticate,
    authorizeRoles('admin'),
    updateProduct
);

router.delete(
    '/:id',
    authenticate,
    authorizeRoles('admin'),
    deleteProduct
);

// AI Description Route
router.post('/generate-description', generateDescription);

// Multer Configuration
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// Image Analysis Route
router.post(
    '/generate-details-from-image',
    upload.single('image'),
    generateDetailsFromImage
);

module.exports = router;
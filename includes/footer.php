    </main>

    <footer>
        <div class="container footer-content glass-panel">
            <div class="social-links">
                <?php if(!empty($portfolio_data['personal_info']['github'])): ?>
                    <a href="<?= htmlspecialchars($portfolio_data['personal_info']['github']) ?>" target="_blank" rel="noopener noreferrer">GitHub</a>
                <?php endif; ?>
                <?php if(!empty($portfolio_data['personal_info']['linkedin'])): ?>
                    <a href="<?= htmlspecialchars($portfolio_data['personal_info']['linkedin']) ?>" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                <?php endif; ?>
            </div>
            <p>&copy; <?= date('Y') ?> <?= htmlspecialchars($portfolio_data['personal_info']['name']) ?>. Built with PHP.</p>
        </div>
    </footer>

    <script src="assets/js/script.js"></script>
</body>
</html>

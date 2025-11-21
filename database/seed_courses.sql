-- 50 realistic course entries (embedding NULL initially)
INSERT INTO items (title, description, category, tags, difficulty, embedding) VALUES
('Python Fundamentals', 'Learn Python syntax, control flow, and data structures.', 'Programming', ARRAY['python','basics','syntax'], 'Beginner', NULL),
('Advanced Python Patterns', 'Master design patterns and best practices in Python.', 'Programming', ARRAY['python','patterns','best-practices'], 'Advanced', NULL),
('JavaScript Essentials', 'Variables, functions, and modern ES features.', 'Programming', ARRAY['javascript','es6','frontend'], 'Beginner', NULL),
('TypeScript for React', 'Build robust React apps with TypeScript.', 'Programming', ARRAY['typescript','react','frontend'], 'Intermediate', NULL),
('Data Structures & Algorithms', 'Core CS algorithms and complexity analysis.', 'Programming', ARRAY['algorithms','ds','cs'], 'Intermediate', NULL),
('Intro to Databases', 'Relational modeling, SQL, and transactions.', 'Programming', ARRAY['sql','database','relational'], 'Beginner', NULL),
('Postgres Deep Dive', 'Indexes, performance, and extensions like pgvector.', 'Programming', ARRAY['postgres','performance','pgvector'], 'Advanced', NULL),
('Docker & Containers', 'Package and ship applications with Docker.', 'Programming', ARRAY['docker','containers','devops'], 'Intermediate', NULL),
('Kubernetes Basics', 'Workloads, services, and deployments in K8s.', 'Programming', ARRAY['kubernetes','devops','cloud'], 'Intermediate', NULL),
('Git Mastery', 'Branching strategies, rebasing, and collaboration.', 'Programming', ARRAY['git','version-control','workflow'], 'Beginner', NULL),

('UI Design Principles', 'Typography, spacing, color, and visual hierarchy.', 'Design', ARRAY['ui','typography','color'], 'Beginner', NULL),
('Advanced Figma', 'Component libraries, prototyping, and collaboration.', 'Design', ARRAY['figma','components','prototyping'], 'Intermediate', NULL),
('Design Systems 101', 'Create scalable, consistent design systems.', 'Design', ARRAY['design-system','components','tokens'], 'Intermediate', NULL),
('UX Research Methods', 'Interviews, surveys, and usability testing.', 'Design', ARRAY['ux','research','usability'], 'Intermediate', NULL),
('Motion Design for Interfaces', 'Micro-interactions and meaningful motion.', 'Design', ARRAY['motion','animations','ui'], 'Advanced', NULL),

('Startup Finance Basics', 'Runway, burn rate, and financial modeling.', 'Business', ARRAY['finance','startup','modeling'], 'Intermediate', NULL),
('Operations Management', 'Processes, KPIs, and continuous improvement.', 'Business', ARRAY['operations','kpi','process'], 'Intermediate', NULL),
('Product Management Foundations', 'Roadmaps, discovery, and execution.', 'Business', ARRAY['product','roadmap','discovery'], 'Beginner', NULL),
('Project Management with Agile', 'Scrum, Kanban, and delivery practices.', 'Business', ARRAY['agile','scrum','kanban'], 'Intermediate', NULL),
('Negotiation Skills', 'Strategies to create and claim value.', 'Business', ARRAY['negotiation','strategy','communication'], 'Intermediate', NULL),

('Digital Marketing 101', 'SEO, SEM, email, and social strategies.', 'Marketing', ARRAY['seo','sem','email'], 'Beginner', NULL),
('Content Strategy', 'Planning, creation, and distribution frameworks.', 'Marketing', ARRAY['content','strategy','branding'], 'Intermediate', NULL),
('Performance Marketing', 'Attribution, CAC/LTV, and growth loops.', 'Marketing', ARRAY['cpc','analytics','growth'], 'Advanced', NULL),
('Brand Building', 'Positioning, identity, and consistency.', 'Marketing', ARRAY['brand','identity','positioning'], 'Intermediate', NULL),
('Analytics with GA4', 'Tracking plans and dashboards in GA4.', 'Marketing', ARRAY['ga4','analytics','tracking'], 'Intermediate', NULL),

('Intro to Data Science', 'Python, pandas, and exploratory analysis.', 'Data Science', ARRAY['pandas','eda','python'], 'Beginner', NULL),
('Statistics for DS', 'Hypothesis testing and confidence intervals.', 'Data Science', ARRAY['statistics','inference','probability'], 'Intermediate', NULL),
('Data Visualization', 'Best practices with Matplotlib and Seaborn.', 'Data Science', ARRAY['viz','matplotlib','seaborn'], 'Beginner', NULL),
('Feature Engineering', 'Transformations, encodings, and leakage avoidance.', 'Data Science', ARRAY['features','ml','preprocessing'], 'Intermediate', NULL),
('MLOps Fundamentals', 'Model lifecycle, monitoring, and CI/CD.', 'Data Science', ARRAY['mlops','deployment','monitoring'], 'Advanced', NULL),

('Machine Learning Basics', 'Supervised and unsupervised learning overview.', 'AI/ML', ARRAY['ml','supervised','unsupervised'], 'Beginner', NULL),
('Deep Learning with PyTorch', 'Build and train neural networks in PyTorch.', 'AI/ML', ARRAY['pytorch','nn','training'], 'Intermediate', NULL),
('Transformers Explained', 'Attention, encoders/decoders, and applications.', 'AI/ML', ARRAY['transformers','nlp','attention'], 'Advanced', NULL),
('Vector Databases', 'Similarity search and embeddings 101.', 'AI/ML', ARRAY['vector','embeddings','retrieval'], 'Intermediate', NULL),
('RAG Systems', 'Retrieval-Augmented Generation patterns and tooling.', 'AI/ML', ARRAY['rag','retrieval','generation'], 'Advanced', NULL),

('Cybersecurity Basics', 'Threat models, CIA triad, and risk assessment.', 'Cybersecurity', ARRAY['security','risk','basics'], 'Beginner', NULL),
('Network Security', 'Protocols, firewalls, and IDS/IPS.', 'Cybersecurity', ARRAY['network','firewall','ids'], 'Intermediate', NULL),
('Application Security', 'OWASP Top 10 and secure coding.', 'Cybersecurity', ARRAY['owasp','secure-coding','web'], 'Intermediate', NULL),
('Cloud Security', 'Shared responsibility, IAM, and compliance.', 'Cybersecurity', ARRAY['cloud','iam','compliance'], 'Advanced', NULL),
('Incident Response', 'Detection, triage, and postmortems.', 'Cybersecurity', ARRAY['ir','detection','forensics'], 'Advanced', NULL),

('SQL Mastery', 'Window functions, CTEs, and optimization.', 'Programming', ARRAY['sql','queries','optimization'], 'Intermediate', NULL),
('Go for Backend Devs', 'Goroutines, channels, and web services.', 'Programming', ARRAY['go','concurrency','backend'], 'Intermediate', NULL),
('Rust Fundamentals', 'Ownership, borrowing, and safety.', 'Programming', ARRAY['rust','safety','systems'], 'Intermediate', NULL),
('Clean Architecture', 'Maintainable, testable systems at scale.', 'Programming', ARRAY['architecture','clean','patterns'], 'Advanced', NULL),
('API Design', 'REST, pagination, and versioning best practices.', 'Programming', ARRAY['api','rest','design'], 'Intermediate', NULL),

('NoSQL Databases', 'Document, key-value, and columnar stores.', 'Programming', ARRAY['nosql','mongodb','cassandra'], 'Intermediate', NULL),
('Real-time Systems', 'WebSockets, streaming, and backpressure.', 'Programming', ARRAY['realtime','websocket','streaming'], 'Advanced', NULL),
('Testing Strategies', 'Unit, integration, and end-to-end testing.', 'Programming', ARRAY['testing','unit','integration'], 'Intermediate', NULL),
('CI/CD Pipelines', 'Automate builds, tests, and deployments.', 'Programming', ARRAY['ci','cd','automation'], 'Intermediate', NULL),
('Systems Design Interview', 'Scalable architectures and tradeoffs.', 'Programming', ARRAY['scalability','design','interview'], 'Intermediate', NULL);


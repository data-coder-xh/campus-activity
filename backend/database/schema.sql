DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student','admin') NOT NULL DEFAULT 'student',
    name VARCHAR(50) NOT NULL,
    student_id VARCHAR(32) NOT NULL UNIQUE,
    phone VARCHAR(20) DEFAULT '',
    major VARCHAR(50) DEFAULT '',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_user_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    cover VARCHAR(255) DEFAULT '',
    description TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    place VARCHAR(100) NOT NULL,
    `limit` INT DEFAULT 0,
    status TINYINT DEFAULT 1,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    remark VARCHAR(255) DEFAULT '',
    status TINYINT DEFAULT 0,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reg_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reg_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_user_event (user_id, event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO users (username, password_hash, role, name, student_id, phone, major) VALUES
('admin', '$2b$10$X1ju3sP8rmvi9RDdtLEBjuESlssgz8L0bWwLtO9PHoV2YJJx9.dpG', 'admin', '管理员', '00000000', '13800000000', '教务处'),
('student01', '$2b$10$G3dWIhB.xUMSLM81BOmkzOT6YNZe.DhBEdD7xOWMOK/RMKBGIO13W', 'student', '张伟', '20230001', '13800000001', '计算机学院');

INSERT INTO events (title, cover, description, start_time, end_time, place, `limit`, status) VALUES
('AI 创新工作坊', 'https://picsum.photos/seed/ai/640/360', '面向全校学生的 AI 实践活动，包含算法讲解与实操。', '2025-12-05 14:00:00', '2025-12-05 17:00:00', '信息楼 301', 50, 1),
('校园马拉松', 'https://picsum.photos/seed/run/640/360', '冬季校园马拉松，设立男女子组，前 100 名可获得纪念品。', '2025-12-20 07:00:00', '2025-12-20 11:30:00', '田径场集合', 200, 1);

INSERT INTO registrations (user_id, event_id, remark, status) VALUES
(1, 1, '希望体验 AI 实验', 1),
(2, 2, '第一次参加马拉松', 0);


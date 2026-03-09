START TRANSACTION;


INSERT INTO users VALUES (id, user_name, user_pass, age, email_add, birth_date, created_at)
('20231704', 'Dav', 'asd123', '21', '20231704@nbsc.edu.ph', '2004-11-08'),
('20231604', 'Loyd James', 'asdasd', '23', '20231604@nbsc.edu.ph', '2004-01-10'),
('20231809', 'Dex', '123123', '22', '20231809@nbsc.edu.ph', '2004-09-02');

INSERT INTO users VALUES (log_id, id, action)
('1', '20231704', 'active'),
('2', '20231604', 'active'),
('3', '20231809', 'active'),


INSERT INTO users VALUES (log_id, noise_levels, noise_status)
('1', '89dB', 'Current Noise'),
('2', '26dB', 'Average Noise'),
('3', '99dB', 'Max Noise'),
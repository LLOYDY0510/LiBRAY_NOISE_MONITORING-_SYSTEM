  START TRANSACTION;
  
  CREATE TABLE users (

    id INT AUTO_INCREMENT PRIMARY KEY,

    user_name VARCHAR(30) NOT NULL UNIQUE,

    user_pass VARCHAR(30) NOT NULL,

    age INT NOT NULL,

    email_add VARCHAR(30) NOT NULL,

    birth_date VARCHAR(30) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

) ENGINE=InnoDB;


CREATE TABLE user_activity_logs (

    log_id INT AUTO_INCREMENT PRIMARY KEY,

    id INT NOT NULL,

    action VARCHAR (30) NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id) REFERENCES users(id)
   
) ENGINE=InnoDB;


CREATE TABLE noise_findings (

    log_id INT AUTO_INCREMENT NOT NULL,

    user_id INT,

    noise_levels VARCHAR(30) NOT NULL,

    noise_status VARCHAR(30) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (log_id) REFERENCES user_activity_logs(log_id)
) ENGINE=InnoDB;

COMMIT;
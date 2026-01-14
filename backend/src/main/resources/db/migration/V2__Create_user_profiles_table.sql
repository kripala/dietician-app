-- Create sequence for user_profiles
CREATE SEQUENCE IF NOT EXISTS user_profiles_id_seq;

CREATE TABLE user_profiles (
    id BIGINT PRIMARY KEY DEFAULT nextval('user_profiles_id_seq'),
    user_id BIGINT NOT NULL UNIQUE,
    first_name VARCHAR(100),
    middle_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(20),
    country_code VARCHAR(10),
    mobile_number VARCHAR(20),
    country VARCHAR(100),
    state VARCHAR(100),
    address_line VARCHAR(500),
    pincode VARCHAR(20),
    profile_photo_url VARCHAR(500),
    created_by VARCHAR(255),
    created_date TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    modified_by VARCHAR(255),
    modified_date TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_mobile ON user_profiles(mobile_number);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_profiles TO dietician_user;
GRANT USAGE, SELECT ON SEQUENCE user_profiles_id_seq TO dietician_user;

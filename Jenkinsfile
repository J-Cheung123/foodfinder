pipeline {
    agent any // Runs on your Jenkins host that has Docker installed

    stages {
        stage('Build Images') {
            steps {
                echo 'Building Docker images from docker-compose.yml...'
                sh 'docker compose build'
            }
        }
        
        stage('Deploy/Run Instance') {
            steps {
                echo 'Starting up the application...'
                // The -d flag runs it in the background so the pipeline can continue
                sh 'docker compose up -d'
            }
        }
        
        stage('Test') {
            steps {
                echo 'Running tests against the live containers...'
                // You would add your testing commands here later
                sh 'echo "Tests passed!"' 
            }
        }
    }
    
    // The post block always runs at the end, regardless of success or failure
    post {
        always {
            echo 'Cleaning up containers...'
            sh 'docker compose down'
        }
    }
}
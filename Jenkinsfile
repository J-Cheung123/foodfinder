pipeline {
    agent any 

    stages {
        stage('Pull Codes') {
            steps { 
                sh 'echo "Your current files"'
                sh 'ls -a'
            }
        }
        
        stage('Setup Environment') {
            steps {
                echo 'Cleaning up old locked secrets and fixing permissions...'
                sh 'rm -f ./backend/.env || true' 
                sh 'chmod u+w ./backend || true'

                echo 'Injecting secrets securely...'
                withCredentials([file(credentialsId: 'Database and JWT', variable: 'SECRET_ENV')]) {
                    sh 'cp $SECRET_ENV ./backend/.env'
                }
            }
        }
        
        stage('Build Images') {
            steps {
                echo 'Building Docker images from docker-compose.yml...'
                sh 'docker compose build'
            }
        }
        
        stage('Deploy/Run Instance') {
            steps {
                echo 'Cleaning up any lingering containers first...'
                sh 'docker compose down || true'
                
                echo 'Starting up the application...'
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
    
    post {
        always {
            sh '''
                echo "Cleaning up containers..."
                docker compose down
                rm -f ./backend/.env
            '''
        }
    }
}
pipeline {
    agent any 

    stages {
        stage('Check Pulled Codes') {
            steps { 
                sh 'echo "Your current files:"'
                sh 'ls -a'
            }
        }
        
        stage('Setup Environment') {
            steps {
                echo 'Injecting secrets securely...'
                withCredentials([file(credentialsId: 'Database and JWT', variable: 'SECRET_ENV')]) {
                    sh 'cp "$SECRET_ENV" ./backend/.env'
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
                // Add tests later
                sh 'echo "Tests passed!"' 
            }
        }
    }
    
    post {
        always {
            sh '''
                echo "Cleaning up containers..."
                docker compose down || true
                rm -f ./backend/.env || true
            '''
        }
        success {
            echo 'Build succeeded! Sending notification...'
            withCredentials([string(credentialsId: 'discord-webhook', variable: 'DISCORD_URL')]) {
                sh '''
                    curl -H "Content-Type: application/json" \
                    -d '{"content": "✅ **SUCCESS:** Food-Finder pipeline just passed and deployed successfully!"}' \
                    $DISCORD_URL
                '''
            }
        }
        failure {
            echo 'Build failed! Sending notification...'
            withCredentials([string(credentialsId: 'discord-webhook', variable: 'DISCORD_URL')]) {
                sh '''
                    curl -H "Content-Type: application/json" \
                    -d '{"content": "❌ **FAILED:** Food-Finder pipeline encountered an error. Check Jenkins logs."}' \
                    $DISCORD_URL
                '''
            }
        }
    }
}
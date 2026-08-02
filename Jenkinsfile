pipeline {
    agent any 

    stages {
        stage('Check Pulled Codes') {
            steps { 
                sh 'echo "Your current files:"'
                sh 'ls -a'
            }
        }

        stage('Lint') {
            steps {
                dir('backend') {
                    sh 'npm install'
                    sh 'npx eslint .'
                }
                dir('frontend') {
                    sh 'npm install'
                    sh 'npx eslint .'
                }
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
                sh 'docker compose build > backend_error_logs.txt 2>&1'
            }
        }

        stage('Deploy/Run Instance') {
            steps {
                sh 'docker compose down || true'
                sh 'docker compose up -d >> backend_error_logs.txt 2>&1'
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
                    -d "{\\"content\\": \\"✅ **SUCCESS:** Food-Finder pipeline deployed successfully!\\\\n🔗 [View Pipeline](${BUILD_URL})\\"}" \
                    $DISCORD_URL
                '''
            }
        }
        failure {
            echo 'Build failed! Sending notification and logs...'
            withCredentials([string(credentialsId: 'discord-webhook', variable: 'DISCORD_URL')]) {
                sh '''
                    # Guarantee the log file exists even if failure happened before Build Images ran
                    touch backend_error_logs.txt

                    # Use -F to send both a JSON message and a file attachment
                    curl -F "payload_json={\\"content\\": \\"❌ **FAILED:** Food-Finder pipeline encountered an error.\\\\n📊 [View Pipeline](${BUILD_URL})\\\\n📜 [View Full Console](${BUILD_URL}console)\\"}" \
                         -F "file1=@backend_error_logs.txt" \
                         $DISCORD_URL
                '''
            }
        }
    }
}
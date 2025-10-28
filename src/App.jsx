import React, { useState, useEffect } from 'react';
import { Upload, FileText, BarChart3, TrendingUp, AlertCircle, CheckCircle, Clock, BookOpen, User, LogOut, ChevronRight, Download, Eye } from 'lucide-react';

const initialData = {
  teachers: [
    { id: 1, username: 'teacher1', password: 'pass123', name: 'Dr. Smith' }
  ],
  students: [
    { id: 1, username: 'student1', password: 'pass123', name: 'John Doe', regNo: 'REG001', class: 'A' },
    { id: 2, username: 'student2', password: 'pass123', name: 'Jane Smith', regNo: 'REG002', class: 'A' }
  ],
  classes: [
    { id: 'A', name: 'Class A', teacher: 1, subject: 'Mathematics' },
    { id: 'B', name: 'Class B', teacher: 1, subject: 'Physics' },
    { id: 'C', name: 'Class C', teacher: 1, subject: 'Chemistry' }
  ],
  exams: [
    { id: 1, classId: 'A', type: 'CAT1', subject: 'Mathematics', status: 'completed', avgScore: 75.5, stdDev: 12.3 },
    { id: 2, classId: 'A', type: 'CAT2', subject: 'Mathematics', status: 'pending', avgScore: null, stdDev: null },
    { id: 3, classId: 'A', type: 'FAT', subject: 'Mathematics', status: 'in_progress', avgScore: null, stdDev: null }
  ],
  results: [
    { studentId: 1, examId: 1, q1: 8, q2: 7, q3: 9, q4: 6, q5: 8, total: 38, maxMarks: 50 },
    { studentId: 2, examId: 1, q1: 9, q2: 8, q3: 7, q4: 9, q5: 8, total: 41, maxMarks: 50 }
  ]
};

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '', type: 'teacher' });
  const [data, setData] = useState(initialData);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [uploadStep, setUploadStep] = useState('answerKey');
  const [uploadedFiles, setUploadedFiles] = useState({ answerKey: null, questionPaper: null, scripts: [] });
  const [studentView, setStudentView] = useState('exams');

  const handleLogin = () => {
    const users = loginForm.type === 'teacher' ? data.teachers : data.students;
    const user = users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    
    if (user) {
      setCurrentUser(user);
      setUserType(loginForm.type);
    } else {
      alert('Invalid credentials');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserType(null);
    setSelectedClass(null);
    setSelectedExam(null);
    setLoginForm({ username: '', password: '', type: 'teacher' });
  };

  const handleFileUpload = (e, type) => {
    const files = Array.from(e.target.files);
    if (type === 'scripts') {
      setUploadedFiles(prev => ({ ...prev, scripts: [...prev.scripts, ...files] }));
    } else {
      setUploadedFiles(prev => ({ ...prev, [type]: files[0] }));
    }
  };

  const processUploads = () => {
    alert('Processing uploads...\n\n1. Parse answer key and question paper\n2. Extract student info from scripts\n3. Perform OCR and image processing\n4. Compare answers using semantic similarity\n5. Calculate marks and generate statistics');
    
    const updatedExams = data.exams.map(exam => 
      exam.id === selectedExam.id ? { ...exam, status: 'completed', avgScore: 78.2, stdDev: 11.5 } : exam
    );
    setData({ ...data, exams: updatedExams });
    setSelectedExam({ ...selectedExam, status: 'completed', avgScore: 78.2, stdDev: 11.5 });
    setUploadStep('answerKey');
    setUploadedFiles({ answerKey: null, questionPaper: null, scripts: [] });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">Exam Management System</h1>
            <p className="text-gray-600 mt-2">Login to continue</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setLoginForm({ ...loginForm, type: 'teacher' })}
                className={`flex-1 py-2 rounded-md transition-all ${
                  loginForm.type === 'teacher' ? 'bg-white shadow text-indigo-600' : 'text-gray-600'
                }`}
              >
                Teacher
              </button>
              <button
                onClick={() => setLoginForm({ ...loginForm, type: 'student' })}
                className={`flex-1 py-2 rounded-md transition-all ${
                  loginForm.type === 'student' ? 'bg-white shadow text-indigo-600' : 'text-gray-600'
                }`}
              >
                Student
              </button>
            </div>
            
            <input
              type="text"
              placeholder="Username"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            
            <input
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            
            <button
              onClick={handleLogin}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              Login
            </button>
            
            <div className="text-sm text-gray-600 text-center mt-4">
              <p>Demo credentials:</p>
              <p>Teacher: teacher1 / pass123</p>
              <p>Student: student1 / pass123</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (userType === 'teacher') {
    const teacherClasses = data.classes.filter(c => c.teacher === currentUser.id);
    
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Teacher Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome, {currentUser.name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
            <button onClick={() => { setSelectedClass(null); setSelectedExam(null); }} className="hover:text-indigo-600">
              Classes
            </button>
            {selectedClass && (
              <>
                <ChevronRight className="w-4 h-4" />
                <button onClick={() => setSelectedExam(null)} className="hover:text-indigo-600">
                  {selectedClass.name}
                </button>
              </>
            )}
            {selectedExam && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-indigo-600">{selectedExam.type}</span>
              </>
            )}
          </div>

          {!selectedClass && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Your Classes</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {teacherClasses.map(cls => (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClass(cls)}
                    className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all text-left border-2 border-transparent hover:border-indigo-500"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{cls.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{cls.subject}</p>
                      </div>
                      <ChevronRight className="w-6 h-6 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedClass && !selectedExam && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Exams for {selectedClass.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.exams.filter(e => e.classId === selectedClass.id).map(exam => (
                  <button
                    key={exam.id}
                    onClick={() => setSelectedExam(exam)}
                    className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all text-left border-2 border-transparent hover:border-indigo-500"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-800">{exam.type}</h3>
                      {exam.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {exam.status === 'pending' && <Clock className="w-5 h-5 text-yellow-500" />}
                      {exam.status === 'in_progress' && <AlertCircle className="w-5 h-5 text-blue-500" />}
                    </div>
                    <p className="text-sm text-gray-600">{exam.subject}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        exam.status === 'completed' ? 'bg-green-100 text-green-700' :
                        exam.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {exam.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedExam && (
            <div>
              {selectedExam.status === 'completed' ? (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <BarChart3 className="w-6 h-6 text-indigo-600" />
                      Exam Statistics - {selectedExam.type}
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Class Average</p>
                        <p className="text-3xl font-bold text-blue-600">{selectedExam.avgScore}%</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Standard Deviation</p>
                        <p className="text-3xl font-bold text-purple-600">{selectedExam.stdDev}</p>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        Performance Analysis
                      </h3>
                      <div className="space-y-3">
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                          <p className="font-medium text-red-800">Question 4: Low Performance</p>
                          <p className="text-sm text-red-700 mt-1">65% of students scored below average on this question</p>
                          <p className="text-sm text-red-600 mt-2 italic">
                            <strong>AI Suggestion:</strong> This question involves complex problem-solving. Consider providing more practice problems and step-by-step examples.
                          </p>
                        </div>
                        
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                          <p className="font-medium text-yellow-800">Question 2: Moderate Performance</p>
                          <p className="text-sm text-yellow-700 mt-1">45% of students scored below average</p>
                          <p className="text-sm text-yellow-600 mt-2 italic">
                            <strong>AI Suggestion:</strong> Students may need clarification on terminology. Consider creating a glossary.
                          </p>
                        </div>
                        
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                          <p className="font-medium text-green-800">Questions 1, 3, 5: Strong Performance</p>
                          <p className="text-sm text-green-700 mt-1">Students demonstrated good understanding</p>
                          <p className="text-sm text-green-600 mt-2 italic">
                            <strong>AI Suggestion:</strong> These topics are well-understood. You can build on these concepts.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      Individual Results
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Student</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Reg No</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Q1</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Q2</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Q3</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Q4</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Q5</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {data.results.filter(r => r.examId === selectedExam.id).map((result, idx) => {
                            const student = data.students.find(s => s.id === result.studentId);
                            return (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm">{student.name}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{student.regNo}</td>
                                <td className="px-4 py-3 text-center text-sm">{result.q1}/10</td>
                                <td className="px-4 py-3 text-center text-sm">{result.q2}/10</td>
                                <td className="px-4 py-3 text-center text-sm">{result.q3}/10</td>
                                <td className="px-4 py-3 text-center text-sm">{result.q4}/10</td>
                                <td className="px-4 py-3 text-center text-sm">{result.q5}/10</td>
                                <td className="px-4 py-3 text-center font-semibold">{result.total}/{result.maxMarks}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <h2 className="text-xl font-semibold mb-6">Upload Exam Materials - {selectedExam.type}</h2>
                  
                  <div className="space-y-6">
                    <div className={`border-2 rounded-lg p-6 ${uploadedFiles.answerKey ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Step 1: Upload Answer Key
                        </h3>
                        {uploadedFiles.answerKey && <CheckCircle className="w-5 h-5 text-green-600" />}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Upload the answer key PDF.</p>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileUpload(e, 'answerKey')}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                      {uploadedFiles.answerKey && (
                        <p className="text-sm text-green-600 mt-2">✓ {uploadedFiles.answerKey.name}</p>
                      )}
                    </div>

                    <div className={`border-2 rounded-lg p-6 ${uploadedFiles.questionPaper ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Step 2: Upload Question Paper
                        </h3>
                        {uploadedFiles.questionPaper && <CheckCircle className="w-5 h-5 text-green-600" />}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Upload the question paper PDF.</p>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileUpload(e, 'questionPaper')}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                      {uploadedFiles.questionPaper && (
                        <p className="text-sm text-green-600 mt-2">✓ {uploadedFiles.questionPaper.name}</p>
                      )}
                    </div>

                    <div className={`border-2 rounded-lg p-6 ${uploadedFiles.scripts.length > 0 ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Upload className="w-5 h-5" />
                          Step 3: Upload Answer Scripts
                        </h3>
                        {uploadedFiles.scripts.length > 0 && <CheckCircle className="w-5 h-5 text-green-600" />}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Upload student answer scripts as PDFs.</p>
                      <input
                        type="file"
                        accept=".pdf"
                        multiple
                        onChange={(e) => handleFileUpload(e, 'scripts')}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                      {uploadedFiles.scripts.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {uploadedFiles.scripts.map((file, idx) => (
                            <p key={idx} className="text-sm text-green-600">✓ {file.name}</p>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={processUploads}
                      disabled={!uploadedFiles.answerKey || !uploadedFiles.questionPaper || uploadedFiles.scripts.length === 0}
                      className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Upload className="w-5 h-5" />
                      Process and Generate Results
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (userType === 'student') {
    const studentClass = data.classes.find(c => c.id === currentUser.class);
    const studentExams = data.exams.filter(e => e.classId === currentUser.class && e.status === 'completed');
    const studentResults = data.results.filter(r => r.studentId === currentUser.id);

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Student Dashboard</h1>
                <p className="text-sm text-gray-600">{currentUser.name} - {currentUser.regNo}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-xl shadow-lg mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-indigo-100 text-sm">Class</p>
                <p className="text-xl font-semibold">{studentClass?.name}</p>
              </div>
              <div>
                <p className="text-indigo-100 text-sm">Subject</p>
                <p className="text-xl font-semibold">{studentClass?.subject}</p>
              </div>
              <div>
                <p className="text-indigo-100 text-sm">Completed Exams</p>
                <p className="text-xl font-semibold">{studentResults.length}</p>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-4">Your Exam Results</h2>
          <div className="space-y-4">
            {studentResults.map((result, idx) => {
              const exam = data.exams.find(e => e.id === result.examId);
              const percentage = ((result.total / result.maxMarks) * 100).toFixed(1);
              
              return (
                <div key={idx} className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{exam.type}</h3>
                      <p className="text-sm text-gray-600">{exam.subject}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-indigo-600">{percentage}%</p>
                      <p className="text-sm text-gray-600">{result.total}/{result.maxMarks}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Question-wise Breakdown</h4>
                    <div className="grid grid-cols-5 gap-3">
                      {[1, 2, 3, 4, 5].map(q => (
                        <div key={q} className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Q{q}</p>
                          <p className="font-semibold text-lg">{result[`q${q}`]}/10</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <p className="text-sm font-medium text-blue-800">Class Average: {exam.avgScore}%</p>
                    <p className="text-xs text-blue-700 mt-1">
                      {percentage >= exam.avgScore ? '✓ Above average' : '⚠ Below average'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {studentResults.length === 0 && (
            <div className="bg-white p-12 rounded-xl shadow-sm text-center">
              <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Results Yet</h3>
              <p className="text-gray-600">Your exam results will appear here once they are published.</p>
            </div>
          )}
        </div>
      </div>
    );
  }
};

export default App;
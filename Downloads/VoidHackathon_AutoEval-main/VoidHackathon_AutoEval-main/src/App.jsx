import React, { useState, useEffect } from "react";
import {
  Calendar,
  Upload,
  CheckCircle,
  Clock,
  FileText,
  BookOpen,
  Users,
  Send,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import API from "./api"; // Axios instance pointing to http://localhost:5000/api

const AIAssignmentSystem = () => {
  const [userType, setUserType] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Login/Register
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Teacher
  const [assignments, setAssignments] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    subject: "",
    startDate: "",
    deadline: "",
    answerKey: null,
    rubric: "",
    latePenalty: 10,
  });

  // Student
  const [studentSubmissions, setStudentSubmissions] = useState({});
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);

  // --------------------------
  // AUTH
  // --------------------------
  const handleRegister = async () => {
    try {
      const res = await API.post("/auth/register", {
        email: loginEmail,
        password: loginPassword,
        role: userType,
      });
      alert("Registered successfully!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  const handleLogin = async () => {
    try {
      const res = await API.post("/auth/login", {
        email: loginEmail,
        password: loginPassword,
        role: userType,
      });

      localStorage.setItem("token", res.data.token);
      setCurrentUser(res.data.user);
      setIsLoggedIn(true);

      // Fetch assignments
      const assignmentsRes = await API.get(
        userType === "teacher" ? "/teacher/assignments" : "/student/assignments",
        {
          headers: { Authorization: `Bearer ${res.data.token}` },
        }
      );
      setAssignments(assignmentsRes.data);

      // If student, also fetch submissions
      if (userType === "student") {
        const submissionsRes = await API.get("/student/submissions", {
          headers: { Authorization: `Bearer ${res.data.token}` },
        });
        const submissionsMap = {};
        submissionsRes.data.forEach((s) => {
          submissionsMap[s.assignmentId] = s;
        });
        setStudentSubmissions(submissionsMap);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Login failed");
    }
  };

  // --------------------------
  // TEACHER
  // --------------------------
  const handleCreateAssignment = async () => {
    try {
      const formData = new FormData();
      for (let key in newAssignment) {
        formData.append(key, newAssignment[key]);
      }
      const token = localStorage.getItem("token");

      const res = await API.post("/teacher/create-assignment", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAssignments([...assignments, res.data]);
      setShowCreateForm(false);
      setNewAssignment({
        title: "",
        subject: "",
        startDate: "",
        deadline: "",
        answerKey: null,
        rubric: "",
        latePenalty: 10,
      });
      alert("Assignment created successfully!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to create assignment");
    }
  };

  const handlePublishResults = async (assignmentId) => {
    try {
      const token = localStorage.getItem("token");
      await API.post(`/teacher/publish/${assignmentId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignments(
        assignments.map((a) => (a._id === assignmentId ? { ...a, published: true } : a))
      );
    } catch (err) {
      console.error(err);
      alert("Failed to publish results");
    }
  };

  // --------------------------
  // STUDENT
  // --------------------------
  const handleStudentSubmission = async (assignmentId) => {
    if (!uploadFile) return;
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      const token = localStorage.getItem("token");

      const res = await API.post(`/student/submit/${assignmentId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setStudentSubmissions({
        ...studentSubmissions,
        [assignmentId]: res.data,
      });

      setUploadFile(null);
      setSelectedAssignment(null);
      alert("Assignment submitted successfully!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Submission failed");
    }
  };

  // Login Page
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
            <div className="flex items-center justify-center mb-4">
              <BookOpen className="w-12 h-12" />
            </div>
            <h1 className="text-3xl font-bold text-center">EduAssign AI</h1>
            <p className="text-center text-blue-100 mt-2">Smart Assignment Management</p>
          </div>
          
          {!userType ? (
            <div className="p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Select Your Role</h2>
              <div className="space-y-4">
                <button
                  onClick={() => setUserType('teacher')}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 flex items-center justify-center gap-3 shadow-lg"
                >
                  <Users className="w-6 h-6" />
                  Login as Teacher
                </button>
                <button
                  onClick={() => setUserType('student')}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all transform hover:scale-105 flex items-center justify-center gap-3 shadow-lg"
                >
                  <BookOpen className="w-6 h-6" />
                  Login as Student
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                  {userType === 'teacher' ? 'Teacher' : 'Student'} Login
                </h2>
                <button
                  onClick={() => {
                    setUserType(null);
                    setLoginEmail('');
                    setLoginPassword('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Change Role
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder={userType === 'teacher' ? 'teacher@school.edu' : 'student@school.edu'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={handleLogin}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
                >
                  Login
                </button>
              </div>
              
              <p className="text-center text-sm text-gray-500 mt-6">
                Demo Mode: Use any email/password to login
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Teacher Dashboard
  if (userType === 'teacher') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
                <p className="text-blue-100">Welcome, {currentUser.name}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsLoggedIn(false);
                setUserType(null);
                setCurrentUser(null);
              }}
              className="bg-white/20 hover:bg-white/30 px-6 py-2 rounded-lg transition-all"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-6">
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-lg flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Create New Assignment
            </button>
          </div>

          {showCreateForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                  <h2 className="text-2xl font-bold">Create New Assignment</h2>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Title</label>
                    <input
                      type="text"
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <select
                      value={newAssignment.subject}
                      onChange={(e) => setNewAssignment({...newAssignment, subject: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Subject</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="History">History</option>
                      <option value="English">English</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={newAssignment.startDate}
                        onChange={(e) => setNewAssignment({...newAssignment, startDate: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
                      <input
                        type="date"
                        value={newAssignment.deadline}
                        onChange={(e) => setNewAssignment({...newAssignment, deadline: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="flex items-center gap-2">
                        Answer Key (Hidden from Students)
                        <EyeOff className="w-4 h-4 text-red-500" />
                      </span>
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setNewAssignment({...newAssignment, answerKey: e.target.files[0]})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      accept=".pdf,.doc,.docx"
                    />
                    <p className="text-xs text-red-600 mt-1">🔒 This file will never be visible to students</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Evaluation Rubric</label>
                    <textarea
                      value={newAssignment.rubric}
                      onChange={(e) => setNewAssignment({...newAssignment, rubric: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows="4"
                      placeholder="Describe evaluation criteria: accuracy, methodology, presentation..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Late Penalty (% per day)</label>
                    <input
                      type="number"
                      value={newAssignment.latePenalty}
                      onChange={(e) => setNewAssignment({...newAssignment, latePenalty: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleCreateAssignment}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700"
                    >
                      Create Assignment
                    </button>
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Assignments</h2>
            
            {assignments.map((assignment) => (
              <div key={assignment.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{assignment.title}</h3>
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                        {assignment.subject}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">Deadline: {assignment.deadline}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">Submissions: {assignment.submissions}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">AI Evaluated: {assignment.evaluated}/{assignment.submissions}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {assignment.published ? (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Published
                          </span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Not Published
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    {!assignment.published && assignment.evaluated === assignment.submissions && assignment.submissions > 0 && (
                      <button
                        onClick={() => handlePublishResults(assignment.id)}
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Publish Results
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Student Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Student Dashboard</h1>
              <p className="text-indigo-100">Welcome, {currentUser.name}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsLoggedIn(false);
              setUserType(null);
              setCurrentUser(null);
            }}
            className="bg-white/20 hover:bg-white/30 px-6 py-2 rounded-lg transition-all"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Available Assignments</h2>
        
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const submission = studentSubmissions[assignment.id];
            const isLate = new Date() > new Date(assignment.deadline);
            
            return (
              <div key={assignment.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{assignment.title}</h3>
                      <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                        {assignment.subject}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3 mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">Due: {assignment.deadline}</span>
                      </div>
                      {isLate && !submission && (
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Late Submission (Penalty Applied)</span>
                        </div>
                      )}
                    </div>

                    {submission ? (
                      <div className="bg-gray-50 rounded-lg p-4 mt-4">
                        {submission.status === 'evaluating' ? (
                          <div className="flex items-center gap-3 text-blue-600">
                            <Clock className="w-5 h-5 animate-spin" />
                            <span className="font-medium">AI is evaluating your submission...</span>
                          </div>
                        ) : submission.status === 'evaluated' && !assignment.published ? (
                          <div className="flex items-center gap-3 text-yellow-600">
                            <Clock className="w-5 h-5" />
                            <span className="font-medium">Evaluation complete. Waiting for teacher to publish results...</span>
                          </div>
                        ) : assignment.published ? (
                          <div>
                            <div className="flex items-center gap-3 text-green-600 mb-3">
                              <CheckCircle className="w-6 h-6" />
                              <span className="font-bold text-2xl">Score: {submission.marks}/100</span>
                            </div>
                            <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                AI Evaluation Report:
                              </h4>
                              <p className="text-gray-700 leading-relaxed">{submission.feedback}</p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedAssignment(assignment._id)}
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Submit Assignment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedAssignment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
              <h2 className="text-2xl font-bold">Submit Assignment</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Your Answer Sheet</label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <p className="text-xs text-gray-500 mt-2">Accepted formats: PDF, JPG, PNG</p>
                {uploadFile && (
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    File selected: {uploadFile.name}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleStudentSubmission(selectedAssignment)}
                  disabled={!uploadFile}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit
                </button>
                <button
                  onClick={() => {
                    setSelectedAssignment(null);
                    setUploadFile(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssignmentSystem;
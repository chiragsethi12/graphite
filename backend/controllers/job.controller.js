import Job from "../models/Job.model.js";
import Application from "../models/Application.model.js";

export const createJob = async (req, res) => {
    const { title, company, location, type, description, skills } = req.body;
    const job = await Job.create({ postedBy: req.user._id, title, company, location, type, description, skills });
    res.status(201).json({ success: true, job });
};

export const getJobs = async (req, res) => {
    const { search, type } = req.query;
    const filter = {};
    if (search) filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
    ];
    if (type) filter.type = type;

    const jobs = await Job.find(filter).sort({ createdAt: -1 }).populate("postedBy", "name profilePic");
    res.json({ success: true, jobs });
};

export const getJobById = async (req, res) => {
    const job = await Job.findById(req.params.id).populate("postedBy", "name profilePic headline");
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, job });
};

export const applyForJob = async (req, res) => {
    const existing = await Application.findOne({ job: req.params.id, applicant: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: "Already applied" });

    const application = await Application.create({ job: req.params.id, applicant: req.user._id });
    await Job.findByIdAndUpdate(req.params.id, { $addToSet: { applicants: req.user._id } });

    res.status(201).json({ success: true, application });
};

export const getMyApplications = async (req, res) => {
    const applications = await Application.find({ applicant: req.user._id }).populate("job");
    res.json({ success: true, applications });
};
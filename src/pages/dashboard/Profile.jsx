import { AiOutlineLoading } from "react-icons/ai";
import { 
	MdOutlinePerson, 
	MdOutlineEmail, 
	MdOutlinePhone, 
	MdOutlineImage,
	MdOutlineSecurity,
	MdOutlineEdit,
	MdOutlineSave
} from "react-icons/md";
import { useProfile } from "../../hooks/use-profile";
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	TextField,
	Avatar,
	Card,
	CardContent,
	Divider,
	IconButton,
	Tooltip,
	Alert,
	Box
} from "@mui/material";

const Profile = () => {
	const {
		formData,
		handleChange,
		handleSubmit,
		isPatchProfileLoading,

		// Patch
		credentials,
		setCredentials,
		handleUpdateAcccountPassword,
		patchingAccountPassword,

		// Modal
		handleCloseModal,
		handleOpenModal,
		modal,
	} = useProfile();

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
			<div className="max-w-6xl mx-auto">
				{/* Header Section */}
				<div className="text-center mb-8">
					<h1 className="text-4xl font-bold text-gray-800 mb-2">Profile Settings</h1>
					<p className="text-gray-600 text-lg">Manage your account information and security settings</p>
				</div>

				{/* Profile Picture Section */}
				<Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
					<CardContent className="p-8">
						<div className="flex flex-col items-center space-y-6">
							<div className="relative">
								<Avatar
									src={
										formData.profile_picture && !(formData.profile_picture instanceof File)
											? formData.profile_picture
											: undefined
									}
									alt="Profile"
									sx={{
										width: 120,
										height: 120,
										border: '4px solid #fff',
										boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
									}}
								>
									{!formData.profile_picture && <MdOutlinePerson size={60} />}
								</Avatar>
								
								{formData.profile_picture instanceof File && (
									<Avatar
										src={URL.createObjectURL(formData.profile_picture)}
										alt="Preview"
										sx={{
											width: 120,
											height: 120,
											border: '4px solid #fff',
											boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
										}}
									/>
								)}
								
								<Tooltip title="Change Profile Picture">
									<IconButton
										component="label"
										sx={{
											position: 'absolute',
											bottom: 0,
											right: 0,
											backgroundColor: '#3b82f6',
											color: 'white',
											'&:hover': {
												backgroundColor: '#2563eb'
											}
										}}
									>
										<MdOutlineEdit />
										<input
											type="file"
											name="profile_picture"
											onChange={handleChange}
											accept="image/*"
											hidden
										/>
									</IconButton>
								</Tooltip>
							</div>
							
							<div className="text-center">
								<h2 className="text-2xl font-semibold text-gray-800 mb-2">
									{formData.first_name} {formData.last_name}
								</h2>
								<p className="text-gray-600 text-lg">@{formData.username}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Main Form Section */}
				<Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
					<CardContent className="p-8">
						<div className="mb-8">
							<h3 className="text-2xl font-semibold text-gray-800 mb-2 flex items-center gap-3">
								<MdOutlinePerson className="text-blue-600" />
								Personal Information
							</h3>
							<p className="text-gray-600">Update your personal details and contact information</p>
						</div>

						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* Username */}
								<div className="space-y-2">
									<label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
										<MdOutlinePerson className="text-blue-600" />
										Username
									</label>
									<input
										type="text"
										name="username"
										value={formData.username || ''}
										onChange={handleChange}
										className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
										placeholder="Enter username"
									/>
								</div>

								{/* First Name */}
								<div className="space-y-2">
									<label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
										<MdOutlinePerson className="text-blue-600" />
										First Name
									</label>
									<input
										type="text"
										name="first_name"
										value={formData.first_name || ''}
										onChange={handleChange}
										className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
										placeholder="Enter first name"
									/>
								</div>

								{/* Last Name */}
								<div className="space-y-2">
									<label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
										<MdOutlinePerson className="text-blue-600" />
										Last Name
									</label>
									<input
										type="text"
										name="last_name"
										value={formData.last_name || ''}
										onChange={handleChange}
										className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
										placeholder="Enter last name"
									/>
								</div>

								{/* Phone Number */}
								<div className="space-y-2">
									<label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
										<MdOutlinePhone className="text-blue-600" />
										Phone Number
									</label>
									<input
										type="tel"
										name="phone_number"
										value={formData.phone_number || ''}
										onChange={handleChange}
										className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
										placeholder="Enter phone number"
									/>
								</div>

								{/* Email */}
								<div className="space-y-2 md:col-span-2">
									<label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
										<MdOutlineEmail className="text-blue-600" />
										Email Address
									</label>
									<input
										type="email"
										name="email"
										value={formData.email || ''}
										onChange={handleChange}
										className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
										placeholder="Enter email address"
									/>
								</div>
							</div>

							{/* Submit Button */}
							<div className="pt-6">
								<Button
									type="submit"
									variant="contained"
									size="large"
									disabled={isPatchProfileLoading}
									className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
									startIcon={isPatchProfileLoading ? <AiOutlineLoading className="animate-spin" /> : <MdOutlineSave />}
								>
									{isPatchProfileLoading ? 'Saving...' : 'Save Changes'}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>

				{/* Security Settings Section */}
				<Card className="mt-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
					<CardContent className="p-8">
						<div className="mb-8">
							<h3 className="text-2xl font-semibold text-gray-800 mb-2 flex items-center gap-3">
								<MdOutlineSecurity className="text-red-600" />
								Security Settings
							</h3>
							<p className="text-gray-600">Manage your passwords and account security</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Account Password */}
							<div className="p-6 border border-gray-200 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
								<div className="text-center space-y-4">
									<div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
										<MdOutlineSecurity className="text-blue-600 text-2xl" />
									</div>
									<h4 className="text-lg font-semibold text-gray-800">Account Password</h4>
									<p className="text-gray-600 text-sm">Update your main account password</p>
									<Button
										variant="contained"
										color="primary"
										onClick={() => handleOpenModal("account")}
										className="bg-blue-600 hover:bg-blue-700 rounded-lg px-6 py-2"
									>
										Update Password
									</Button>
								</div>
							</div>

							{/* Withdrawal Password */}
							<div className="p-6 border border-gray-200 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50">
								<div className="text-center space-y-4">
									<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
										<MdOutlineSecurity className="text-green-600 text-2xl" />
									</div>
									<h4 className="text-lg font-semibold text-gray-800">Withdrawal Password</h4>
									<p className="text-gray-600 text-sm">Update your withdrawal password</p>
									<Button
										variant="contained"
										color="success"
										onClick={() => handleOpenModal("withdrawal")}
										className="bg-green-600 hover:bg-green-700 rounded-lg px-6 py-2"
									>
										Update Password
									</Button>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Password Update Modal */}
			<Dialog 
				open={modal.open} 
				onClose={handleCloseModal} 
				fullWidth 
				maxWidth="sm"
				PaperProps={{
					className: "rounded-2xl shadow-2xl"
				}}
			>
				<DialogTitle className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
					<div className="flex items-center gap-3">
						<MdOutlineSecurity className="text-2xl" />
						{modal.type === "account" ? "Update Account Password" : "Update Withdrawal Password"}
					</div>
				</DialogTitle>

				<DialogContent className="p-6 space-y-4">
					<Alert severity="info" className="mb-4">
						Please enter your current password and the new password you'd like to use.
					</Alert>

					<TextField
						label="Current Password"
						type="password"
						fullWidth
						margin="normal"
						variant="outlined"
						value={credentials.current_password}
						onChange={(e) =>
							setCredentials({
								...credentials,
								current_password: e.target.value,
							})
						}
						className="mb-4"
					/>

					<TextField
						label="New Password"
						type="password"
						fullWidth
						margin="normal"
						variant="outlined"
						value={credentials.new_password}
						onChange={(e) =>
							setCredentials({
								...credentials,
								new_password: e.target.value,
							})
						}
					/>
				</DialogContent>

				<DialogActions className="p-6 bg-gray-50">
					<Button
						disabled={patchingAccountPassword}
						onClick={handleCloseModal}
						variant="outlined"
						color="warning"
						className="px-6 py-2"
					>
						Cancel
					</Button>

					<Button
						disabled={patchingAccountPassword}
						onClick={handleUpdateAcccountPassword}
						variant="contained"
						color="primary"
						className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600"
						startIcon={patchingAccountPassword ? <AiOutlineLoading className="animate-spin" /> : <MdOutlineSave />}
					>
						{patchingAccountPassword ? 'Updating...' : 'Update Password'}
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
};

export default Profile;

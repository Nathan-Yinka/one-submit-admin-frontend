import { BsCartDash } from "react-icons/bs";
import { BsBank } from "react-icons/bs";
import { AiFillBook } from "react-icons/ai";
import { NavLink } from "react-router-dom";
import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { MdOutlineDashboard } from "react-icons/md";
import { BiUser, BiCog, BiBookOpen } from "react-icons/bi";
import { AiOutlineLogout, AiOutlineCaretDown } from "react-icons/ai";
import { FaRegCalendarAlt, FaRegEye, FaVideo } from "react-icons/fa";
import logoFull from "../../../assets/logo.avif";
import logoSmall from "../../../assets/logo.avif";
import { handleLogout } from "../../../helpers/handle-logout";

function SideBarWeb({ isCollapsed, closeSidebar }) {
	const [hoveredDropdown, setHoveredDropdown] = useState(null);
	const [hoverTimeout, setHoverTimeout] = useState(null);
	const [isUsersDropdownOpen, setUsersDropdownOpen] = useState(false);
	const [isFinancialDropdownOpen, setFinancialDropdownOpen] = useState(false);

	const handleMouseEnter = (dropdown) => {
		if (hoverTimeout) {
			clearTimeout(hoverTimeout);
		}
		setHoveredDropdown(dropdown);
	};

	const handleMouseLeave = () => {
		const timeout = setTimeout(() => setHoveredDropdown(null), 200); // Delay for smoother transitions
		setHoverTimeout(timeout);
	};

	useEffect(() => {
		return () => {
			if (hoverTimeout) {
				clearTimeout(hoverTimeout);
			}
		};
	}, [hoverTimeout]);

	const navClass = ({ isActive }) =>
		[
			"flex items-center gap-x-3 py-2.5 px-4 rounded-xl border transition-all duration-200",
			isActive
				? "bg-primary/15 text-[#83FF90] border-primary/40 shadow-[0_10px_28px_rgba(34,197,94,0.16)]"
				: "text-gray-300 border-transparent hover:bg-white/10 hover:text-white",
		].join(" ");

	return (
		<div
			className={`transition-all duration-300 ${
				isCollapsed ? "w-16" : "w-64"
			} bg-[#050806] text-white h-full flex flex-col border-r border-primary/25 shadow-2xl`}
		>
			{/* Logo Section */}
			<div className="flex items-center justify-center p-4 m-3 rounded-2xl border border-white/10 bg-white/[0.03]">
				<img
					src={isCollapsed ? logoSmall : logoFull}
					alt="Logo"
					className={`${isCollapsed ? "w-8" : "w-28"}`}
				/>
			</div>

			{/* Navigation Links */}
			<div className="flex-grow px-2 mt-4">
				{/* Dashboard */}
				<div className="relative group">
					<NavLink
						to="/home"
						end // Add this prop for exact matching
						className={navClass}
						onClick={closeSidebar}
					>
						<MdOutlineDashboard className="text-xl" />
						{!isCollapsed && <span>Dashboard</span>}
					</NavLink>
					{isCollapsed && (
						<div className="absolute px-3 py-1 text-sm text-white transition-opacity duration-300 transform -translate-y-1/2 bg-gray-800 rounded-md shadow-md opacity-0 left-full top-1/2 group-hover:opacity-100">
							Dashboard
						</div>
					)}
				</div>

				{/* On Hold Management */}
				<div className="relative group">
					<NavLink
						to="/home/hold"
						className={navClass}
						onClick={closeSidebar} // Close sidebar on click
					>
						<AiFillBook className="text-xl" />
						{!isCollapsed && <span>On Hold Management</span>}
					</NavLink>
					{isCollapsed && (
						<div className="absolute px-3 py-1 text-sm text-white transition-opacity duration-300 transform -translate-y-1/2 bg-gray-800 rounded-md shadow-md opacity-0 left-full top-1/2 group-hover:opacity-100">
							On Hold Management
						</div>
					)}
				</div>

				{/* Users Management */}
				<div
					className="relative group"
					onMouseEnter={() => handleMouseEnter("users")}
					onMouseLeave={handleMouseLeave}
				>
					<button
						className="flex items-center w-full px-4 py-2.5 rounded-xl gap-x-3 text-gray-300 border border-transparent hover:bg-white/10 hover:text-white transition"
						onClick={() => setUsersDropdownOpen(!isUsersDropdownOpen)}
					>
						<BiUser className="text-xl" />
						{!isCollapsed && (
							<>
								<span>Users management</span>
								<AiOutlineCaretDown
									className={`ml-auto transition-transform ${
										isUsersDropdownOpen ? "rotate-180" : ""
									}`}
								/>
							</>
						)}
					</button>

					{/* Dropdown for Expanded Sidebar */}
					{!isCollapsed && isUsersDropdownOpen && (
						<div className="ml-8">
							<NavLink
								to="/home/allusers"
								className={navClass}
								onClick={closeSidebar} // Close sidebar on click
							>
								All users
							</NavLink>
							<NavLink
								to="/home/negusers"
								className={navClass}
								onClick={closeSidebar} // Close sidebar on click
							>
								Negative users
							</NavLink>
						</div>
					)}

					{/* Hover Tooltip for Collapsed Sidebar */}
					{isCollapsed && (
						<div className="absolute left-full top-[1%] transform -translate-y-full bg-gray-800 text-white text-sm px-3 py-1 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
							Users management
						</div>
					)}

					{/* Hover Popup for Collapsed Sidebar Dropdown */}
					{isCollapsed && hoveredDropdown === "users" && (
						<div className="absolute top-0 z-10 text-sm bg-[#101912] border border-white/10 rounded-xl shadow-md left-16">
							<NavLink
								to="/home/negusers"
								className={navClass}
								onClick={closeSidebar} // Close sidebar on click
							>
								All users
							</NavLink>
							<NavLink
								to="/home/negative"
								className={navClass}
								onClick={closeSidebar} // Close sidebar on click
							>
								Negative users
							</NavLink>
						</div>
					)}
				</div>

				{/* Products Management */}
				<div className="relative group">
					<NavLink
						to="/home/products"
						className={navClass}
						onClick={closeSidebar} // Close sidebar on click
					>
						<BsCartDash className="text-xl" />
						{!isCollapsed && <span>Products</span>}
					</NavLink>

					{/* Tooltip for Collapsed Sidebar */}
					{isCollapsed && (
						<div className="absolute z-20 px-3 py-1 text-sm text-white transition-opacity duration-300 transform -translate-y-1/2 bg-gray-800 rounded-md shadow-md opacity-0 left-full top-1/2 group-hover:opacity-100">
							Products
						</div>
					)}
				</div>

				{/* Packs Management */}
				<div className="relative group">
					<NavLink
						to="/home/packs"
						className={navClass}
						onClick={closeSidebar} // Close sidebar on click
					>
						<BiBookOpen className="text-xl" />
						{!isCollapsed && <span>Packs management</span>}
					</NavLink>

					{/* Tooltip for Collapsed Sidebar */}
					{isCollapsed && (
						<div className="absolute z-20 px-3 py-1 text-sm text-white transition-opacity duration-300 transform -translate-y-1/2 bg-gray-800 rounded-md shadow-md opacity-0 left-full top-1/2 group-hover:opacity-100">
							Packs management
						</div>
					)}
				</div>

				{/* Financial Operations */}
				<div
					className="relative group"
					onMouseEnter={() => handleMouseEnter("financial")}
					onMouseLeave={handleMouseLeave}
				>
					<button
						className="flex items-center w-full px-4 py-2.5 rounded-xl gap-x-3 text-gray-300 border border-transparent hover:bg-white/10 hover:text-white transition"
						onClick={() =>
							setFinancialDropdownOpen(!isFinancialDropdownOpen)
						}
					>
						<BsBank className="text-xl" />
						{!isCollapsed && (
							<>
								<span>Financial operations</span>
								<AiOutlineCaretDown
									className={`ml-auto transition-transform ${isFinancialDropdownOpen ? "rotate-180" : ""}`}
								/>
							</>
						)}
					</button>

					{/* Dropdown for Expanded Sidebar */}
					{!isCollapsed && isFinancialDropdownOpen && (
						<div className="ml-8">
							<NavLink
								to="/home/deposits"
								className={navClass}
								onClick={closeSidebar} // Close sidebar on click
							>
								Deposits list
							</NavLink>
							<NavLink
								to="/home/withdrawals"
								className={navClass}
								onClick={closeSidebar} // Close sidebar on click
							>
								Withdrawals list
							</NavLink>
						</div>
					)}

					{/* Hover Tooltip for Collapsed Sidebar */}
					{isCollapsed && (
						<div className="absolute left-full top-[-70%] transform -translate-y-1/2 bg-gray-800 text-white text-sm px-3 py-1 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
							Financial operations
						</div>
					)}

					{/* Hover Popup for Collapsed Sidebar Dropdown */}
					{isCollapsed && hoveredDropdown === "financial" && (
						<div className="absolute top-0 z-10 text-sm bg-[#101912] border border-white/10 rounded-xl shadow-md left-16">
							<NavLink
								to="/home/deposits"
								className={navClass}
								onClick={closeSidebar} // Close sidebar on click
							>
								Deposits list
							</NavLink>
							<NavLink
								to="/home/withdrawals"
								className={navClass}
								onClick={closeSidebar} // Close sidebar on click
							>
								Withdrawals list
							</NavLink>
						</div>
					)}
				</div>

				{/* Events Management */}
				<div className="relative group">
					<NavLink
						to="/home/events"
						className={navClass}
						onClick={closeSidebar} // Close sidebar on click
					>
						<FaRegCalendarAlt className="text-xl" />
						{!isCollapsed && <span>Events management</span>}
					</NavLink>

					{/* Tooltip for Collapsed Sidebar */}
					{isCollapsed && (
						<div className="absolute z-20 px-3 py-1 text-sm text-white transition-opacity duration-300 transform -translate-y-1/2 bg-gray-800 rounded-md shadow-md opacity-0 left-full top-1/2 group-hover:opacity-100">
							Events management
						</div>
					)}
				</div>

				{/* View Logs */}
				<div className="relative group">
					<NavLink
						to="/home/logs"
						className={navClass}
						onClick={closeSidebar} // Close sidebar on click
					>
						<FaRegEye className="text-xl" />
						{!isCollapsed && <span>View logs</span>}
					</NavLink>

					{/* Tooltip for Collapsed Sidebar */}
					{isCollapsed && (
						<div className="absolute z-20 px-3 py-1 text-sm text-white transition-opacity duration-300 transform -translate-y-1/2 bg-gray-800 rounded-md shadow-md opacity-0 left-full top-1/2 group-hover:opacity-100">
							View logs
						</div>
					)}
				</div>

				{/* Settings Management */}
				<div className="relative group">
					<NavLink
						to="/home/settings"
						className={navClass}
						onClick={closeSidebar} // Close sidebar on click
					>
						<BiCog className="text-xl" />
						{!isCollapsed && <span>Settings management</span>}
					</NavLink>

					{/* Tooltip for Collapsed Sidebar */}
					{isCollapsed && (
						<div className="absolute z-20 px-3 py-1 text-sm text-white transition-opacity duration-300 transform -translate-y-1/2 bg-gray-800 rounded-md shadow-md opacity-0 left-full top-1/2 group-hover:opacity-100">
							Settings management
						</div>
					)}
				</div>

				{/* Update Video */}
				<div className="relative group">
					<NavLink
						to="/home/video"
						className={navClass}
						onClick={closeSidebar} // Close sidebar on click
					>
						<FaVideo className="text-xl" />
						{!isCollapsed && <span>Update video</span>}
					</NavLink>

					{/* Tooltip for Collapsed Sidebar */}
					{isCollapsed && (
						<div className="absolute z-20 px-3 py-1 text-sm text-white transition-opacity duration-300 transform -translate-y-1/2 bg-gray-800 rounded-md shadow-md opacity-0 left-full top-1/2 group-hover:opacity-100">
							Update video
						</div>
					)}
				</div>
			</div>

			{/* Logout Button */}
			<button
				onClick={handleLogout}
				className="flex items-center px-4 py-3 m-3 text-red-300 rounded-xl gap-x-3 border border-red-500/15 hover:bg-red-500/10 transition"
			>
				<AiOutlineLogout className="text-xl" />
				{!isCollapsed && <span>Logout</span>}
			</button>
		</div>
	);
}

SideBarWeb.propTypes = {
	isCollapsed: PropTypes.bool.isRequired,
	closeSidebar: PropTypes.func.isRequired,
};

export default SideBarWeb;

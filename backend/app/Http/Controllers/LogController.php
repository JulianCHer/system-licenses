<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LogController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = "SELECT l.*, u.name AS user_name, u.username
                FROM t4_validation_logs l
                LEFT JOIN t0_users u ON u.ip = l.ip_address
                WHERE 1=1";
            $params = [];

            // Logs are stored as "action|description" in attempted_macaddress column
            if ($request->filled('search')) {
                $q = "%" . $request->search . "%";
                $query .= " AND (l.attempted_macaddress LIKE ? OR l.ip_address LIKE ?)";
                $params = array_merge($params, [$q, $q]);
            }
            if ($request->filled('action')) {
                $query .= " AND l.attempted_macaddress LIKE ?";
                $params[] = $request->action . '%';
            }
            if ($request->filled('from')) {
                $query .= " AND DATE(l.created_at) >= ?";
                $params[] = $request->from;
            }
            if ($request->filled('to')) {
                $query .= " AND DATE(l.created_at) <= ?";
                $params[] = $request->to;
            }

            $query .= " ORDER BY l.created_at DESC LIMIT 500";
            $logs = DB::select($query, $params);

            // Parse action and description from attempted_macaddress
            foreach ($logs as $log) {
                $parts = explode('|', $log->attempted_macaddress ?? '', 2);
                $log->action = $parts[0] ?? '';
                $log->description = $parts[1] ?? '';
            }

            return response()->json(['success' => true, 'data' => $logs]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error al listar logs: ' . $e->getMessage()], 500);
        }
    }
}
